// backend/src/services/passwordReset.service.js
// ============================================================
// Servicio de Recuperación de Contraseña
// ============================================================
// Genera tokens seguros de un solo uso con expiración de 1 hora.
// Los tokens se almacenan hasheados en la base de datos para
// prevenir uso malicioso si la DB fuera comprometida.
// ============================================================

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const prisma = require('../config/db');
const logger = require('../config/logger');

/**
 * Genera un token criptográficamente seguro de 32 bytes.
 * @returns {{ plainToken: string, tokenHash: string }}
 */
function generateResetToken() {
    const plainToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
        .createHash('sha256')
        .update(plainToken)
        .digest('hex');

    return { plainToken, tokenHash };
}

/**
 * ADMIN: Genera un enlace de restablecimiento manual para un empleado.
 * No envía correos. Retorna la URL para ser copiada manualmente.
 * 
 * @param {number} userId - ID del empleado
 * @param {string} frontendUrl - URL base del frontend
 * @returns {Promise<string>} La URL completa de recuperación
 */
async function generateAdminResetLink(userId, frontendUrl) {
    const user = await prisma.user.findFirst({
        where: { id: parseInt(userId), deleted_at: null }
    });

    if (!user) {
        const error = new Error('Usuario no encontrado o desactivado.');
        error.statusCode = 404;
        throw error;
    }

    // Invalidar tokens anteriores no usados
    await prisma.passwordResetToken.updateMany({
        where: { user_id: user.id, used_at: null },
        data: { used_at: new Date() }
    });

    const { plainToken, tokenHash } = generateResetToken();

    // Guardar token hasheado (expira en 1 hora)
    await prisma.passwordResetToken.create({
        data: {
            user_id: user.id,
            token_hash: tokenHash,
            expires_at: new Date(Date.now() + 60 * 60 * 1000)
        }
    });

    logger.info(`🔑 Token MANUAL generado por ADMIN para usuario ID: ${user.id}`);

    // Retornar URL
    return `${frontendUrl}/reset-password?token=${plainToken}`;
}

/**
 * Valida un token de reset y establece la nueva contraseña.
 * 
 * @param {string} token - Token en texto plano recibido del email
 * @param {string} newPassword - Nueva contraseña del usuario
 * @throws {Error} Si el token es inválido, expirado o ya fue usado
 */
async function resetPassword(token, newPassword) {
    // Hash del token recibido para comparar con la DB
    const tokenHash = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    // Buscar token válido (no usado, no expirado)
    const resetRecord = await prisma.passwordResetToken.findFirst({
        where: {
            token_hash: tokenHash,
            used_at: null,
            expires_at: {
                gt: new Date(), // No expirado
            },
        },
        include: {
            user: {
                select: { id: true, username: true, deleted_at: true },
            },
        },
    });

    if (!resetRecord) {
        const error = new Error('El enlace de recuperación es inválido o ha expirado. Solicita uno nuevo.');
        error.statusCode = 400;
        throw error;
    }

    if (resetRecord.user.deleted_at !== null) {
        const error = new Error('Esta cuenta ha sido desactivada.');
        error.statusCode = 403;
        throw error;
    }

    // Hashear nueva contraseña
    const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    // Transacción: actualizar contraseña + marcar token como usado + revocar refresh tokens
    await prisma.$transaction([
        // Actualizar contraseña del usuario
        prisma.user.update({
            where: { id: resetRecord.user_id },
            data: {
                password_hash: newPasswordHash,
                refresh_token_hash: null, // Revocar todas las sesiones activas
                must_change_password: false, // El usuario ya ingresó una contraseña propia
            },
        }),
        // Marcar token como usado
        prisma.passwordResetToken.update({
            where: { id: resetRecord.id },
            data: { used_at: new Date() },
        }),
        // Invalidar cualquier otro token pendiente del mismo usuario
        prisma.passwordResetToken.updateMany({
            where: {
                user_id: resetRecord.user_id,
                used_at: null,
                id: { not: resetRecord.id },
            },
            data: { used_at: new Date() },
        }),
    ]);

    logger.info(`🔑 Contraseña restablecida exitosamente para usuario ID: ${resetRecord.user_id}`);

    return { username: resetRecord.user.username };
}

module.exports = {
    generateAdminResetLink,
    resetPassword,
};
