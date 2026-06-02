// backend/src/config/logger.js
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// ---- Desactivado temporalmente para Vercel ----
// const logsDir = path.join(__dirname, '../../logs');
// const fs = require('fs');
// if (!fs.existsSync(logsDir)) {
//     fs.mkdirSync(logsDir, { recursive: true });
// }

/**
 * Configuración de Winston Logger.
 * Registra en archivos rotados diariamente y en consola.
 */
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'gestor-financiero' },
    transports: [
        // ---- Logs en archivos desactivados por error 500 en Vercel ----
        // new DailyRotateFile({
        //     filename: path.join(logsDir, 'error-%DATE%.log'),
        //     datePattern: 'YYYY-MM-DD',
        //     maxSize: '20m',
        //     maxDays: '14d',
        //     level: 'error'
        // }),
        // new DailyRotateFile({
        //     filename: path.join(logsDir, 'combined-%DATE%.log'),
        //     datePattern: 'YYYY-MM-DD',
        //     maxSize: '20m',
        //     maxDays: '30d'
        // }),

        // ---- Consola (siempre activa para Docker stdout/stderr) ----
        new winston.transports.Console({
            format: process.env.NODE_ENV === 'production'
                ? winston.format.json() // JSON estructurado para Docker/CloudWatch
                : winston.format.combine(
                    winston.format.colorize(),
                    winston.format.printf(
                        ({ timestamp, level, message }) =>
                            `[${timestamp}] ${level}: ${message}`
                    )
                )
        })
    ]
});

module.exports = logger;