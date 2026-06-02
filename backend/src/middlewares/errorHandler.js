// backend/src/middlewares/errorHandler.js
const { ZodError } = require('zod');
const logger = require('../config/logger');

/**
 * Middleware de manejo global de errores.
 * Diferencia entre tipos de errores y responde apropiadamente.
 */
const errorHandler = (err, req, res, next) => {
    // Log del error
    logger.error({
        message: err.message,
        errorType: err.constructor.name,
        statusCode: err.statusCode || 500,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userId: req.user?.id,
        stack: err.stack
    });

    let statusCode = 500;
    let message = 'Error interno del servidor';
    let details = undefined;

    // ============ ERRORES DE VALIDACIÓN (Zod) ============
    if (err instanceof ZodError) {
        statusCode = 400;
        message = 'Error de validación';
        details = err.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
            code: e.code
        }));
    }

    // ============ ERRORES JWT ============
    else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Token inválido o malformado';
    }

    else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expirado';
        details = {
            expiredAt: err.expiredAt
        };
    }

    // ============ ERRORES PRISMA ============
    else if (err.code === 'P2002') {
        statusCode = 409;
        message = `El campo ${err.meta?.target?.[0] || 'único'} ya existe`;
    }

    else if (err.code === 'P2025') {
        statusCode = 404;
        message = 'Registro no encontrado';
    }

    else if (err.code && err.code.startsWith('P')) {
        statusCode = 400;
        message = 'Error en la base de datos';
        if (process.env.NODE_ENV !== 'production') {
            details = {
                prismaCode: err.code,
                prismaMessage: err.message
            };
        }
    }

    // ============ ERRORES PERSONALIZADOS ============
    else if (err.statusCode) {
        statusCode = err.statusCode;
        message = err.message;
    }

    // ============ RESPUESTA ============
    const response = {
        status: 'error',
        message,
        timestamp: new Date().toISOString(),
        ...(details && { details }),
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    };

    res.status(statusCode).json(response);
};

module.exports = errorHandler;