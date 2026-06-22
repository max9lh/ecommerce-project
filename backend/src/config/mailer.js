// backend/src/config/mailer.js
// ============================================================
// Servicio de envío de correos electrónicos (Nodemailer)
// ============================================================
// Se autodetecta la configuración SMTP en variables de entorno.
// Si no están configuradas, hace un fallback seguro imprimiendo
// los enlaces de restablecimiento en la consola del servidor.
// ============================================================

const nodemailer = require('nodemailer');
const logger = require('./logger');

let transporter = null;

// Inicializa el transportador solo si las variables SMTP requeridas están configuradas
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT, 10) || 465,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    transporter.verify()
        .then(() => logger.info('✅ Conexión SMTP configurada y verificada correctamente'))
        .catch((err) => logger.error('❌ Error al conectar con el servidor SMTP:', err.message));
} else {
    logger.warn('⚠️ Servidor SMTP no configurado. Los correos de recuperación se imprimirán en consola.');
}

/**
 * Envía un correo de recuperación de contraseña.
 * @param {string} to - Email destino
 * @param {string} resetUrl - URL completa con el token de reset
 * @returns {Promise<void>}
 */
async function sendPasswordResetEmail(to, resetUrl) {
    const subject = 'Recuperación de Contraseña - Gestor Financiero';

    const html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
            <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 32px 24px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">
                        🔐 Recuperación de Contraseña
                    </h1>
                </div>
                
                <!-- Body -->
                <div style="padding: 32px 24px;">
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-top: 0;">
                        Hola,
                    </p>
                    <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                        Recibimos una solicitud para restablecer la contraseña de tu cuenta en el 
                        <strong>Gestor Financiero</strong>. Si no fuiste tú quien la solicitó, puedes ignorar este mensaje.
                    </p>
                    
                    <div style="text-align: center; margin: 32px 0;">
                        <a href="${resetUrl}" 
                           style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #2563eb); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; letter-spacing: 0.5px;">
                            Restablecer mi contraseña
                        </a>
                    </div>
                    
                    <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                        Este enlace expirará en <strong>1 hora</strong> por razones de seguridad.
                    </p>
                    
                    <p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin-top: 24px;">
                        Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:
                    </p>
                    <p style="color: #3b82f6; font-size: 13px; word-break: break-all;">
                        ${resetUrl}
                    </p>
                </div>
                
                <!-- Footer -->
                <div style="background-color: #f9fafb; padding: 20px 24px; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                        Este es un correo automático del Gestor Financiero. No respondas a este mensaje.
                    </p>
                </div>
            </div>
        </body>
        </html>
    `;

    if (transporter) {
        // Envío real por SMTP
        await transporter.sendMail({
            from: `"Gestor Financiero" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
            to,
            subject,
            html,
        });
        logger.info(`📧 Correo de recuperación enviado con éxito a: ${to}`);
    } else {
        // Caída de seguridad en desarrollo: Imprime en consola
        logger.info(`📧 [DEV] Email de recuperación para ${to}:`);
        logger.info(`📧 [DEV] URL de reset: ${resetUrl}`);
        logger.info(`📧 [DEV] (SMTP no configurado en variables de entorno)`);
    }
}

module.exports = {
    sendPasswordResetEmail,
};
