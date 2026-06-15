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
const { sendPasswordResetEmail } = require('../config/mailer');
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
 * Solicita el restablecimiento de contraseña.
 * Busca al usuario por email, genera un token y envía el correo.
 * 
 * NOTA DE SEGURIDAD: Siempre responde con éxito aunque el email
 * no exista, para no revelar qué cuentas están registradas.
 * 
 * @param {string} email - Email del usuario
 * @param {string} frontendUrl - URL base del frontend para construir el link
 */
async function requestPasswordReset(email, frontendUrl) {
    // Buscar usuario por email
    const user = await prisma.user.findFirst({
        where: {
            email: email.toLowerCase().trim(),
            deleted_at: null,
        },
    });

    // Si no existe, no revelar — solo loguear y salir silenciosamente
    if (!user) {
        logger.warn(`🔑 Intento de reset para email no registrado: ${email}`);
        return; // No lanzar error — respuesta genérica en el controller
    }

    // Invalidar tokens anteriores no usados de este usuario
    await prisma.passwordResetToken.updateMany({
        where: {
            user_id: user.id,
            used_at: null,
        },
        data: {
            used_at: new Date(), // Marcar como "consumidos"
        },
    });

    // Generar nuevo token
    const { plainToken, tokenHash } = generateResetToken();

    // Guardar token hasheado con expiración de 1 hora
    await prisma.passwordResetToken.create({
        data: {
            user_id: user.id,
            token_hash: tokenHash,
            expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hora
        },
    });

    // Construir URL de restablecimiento
    const resetUrl = `${frontendUrl}/reset-password?token=${plainToken}`;

    // Enviar email (en dev se loguea en consola)
    await sendPasswordResetEmail(user.email, resetUrl);

    logger.info(`🔑 Token de reset generado para usuario ID: ${user.id}`);
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
    requestPasswordReset,
    resetPassword,
};
