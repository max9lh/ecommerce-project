// backend/src/controllers/passwordReset.controller.js
// ============================================================
// Controller de Recuperación de Contraseña
// ============================================================

const passwordResetService = require('../services/passwordReset.service');



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

module.exports = { resetPassword };
