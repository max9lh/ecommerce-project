// backend/src/controllers/passwordReset.controller.js
// ============================================================
// Controller de Recuperación de Contraseña
// ============================================================

const passwordResetService = require('../services/passwordReset.service');

/**
 * POST /api/auth/forgot-password
 * Solicita un email de recuperación de contraseña.
 */
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        // Construir la URL base del frontend desde CORS_ORIGIN
        const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';

        await passwordResetService.requestPasswordReset(email, frontendUrl);

        // Respuesta genérica para no revelar si el email existe
        return res.status(200).json({
            status: 'success',
            message: 'Si el email está registrado, recibirás un enlace de recuperación en los próximos minutos.',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/auth/reset-password
 * Restablece la contraseña usando el token recibido por email.
 */
const resetPassword = async (req, res, next) => {
    try {
        const { token, newPassword } = req.body;

        const result = await passwordResetService.resetPassword(token, newPassword);

        return res.status(200).json({
            status: 'success',
            message: 'Contraseña restablecida correctamente. Ya puedes iniciar sesión.',
            data: {
                username: result.username,
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { forgotPassword, resetPassword };
