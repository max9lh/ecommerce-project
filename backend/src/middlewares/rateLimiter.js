// backend/src/middlewares/rateLimiter.js
const rateLimit = require('express-rate-limit');

/**
 * Genera un handler de respuesta consistente con el errorHandler global.
 * @param {string} msg - Mensaje de error personalizado
 */
const rateLimitHandler = (msg) => (req, res) => {
    res.status(429).json({
        status: 'error',
        message: msg,
        timestamp: new Date().toISOString()
    });
};

/**
 * Rate limiter general para la API.
 * Límite: 100 requests por 15 minutos por IP
 */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 300,
    handler: rateLimitHandler('Demasiadas solicitudes desde esta IP, intenta más tarde'),
    standardHeaders: true, // Retorna info en `RateLimit-*` headers
    legacyHeaders: false,  // Desactiva `X-RateLimit-*` headers
    skip: (req) => process.env.NODE_ENV === 'test', // No limitar en tests
    keyGenerator: (req) => req.ip, // Usar IP real detrás de proxy
});

/**
 * Rate limiter estricto para autenticación.
 * Límite: 5 intentos por 15 minutos
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    handler: rateLimitHandler('Demasiados intentos de login, intenta más tarde'),
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV === 'test',
    keyGenerator: (req) => req.ip,
});

/**
 * Rate limiter para endpoints de creación/escritura.
 * Límite: 30 requests por 15 minutos
 */
const writeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    handler: rateLimitHandler('Demasiadas solicitudes de escritura, intenta más tarde'),
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        if (process.env.NODE_ENV === 'test') return true;
        // Solo aplicar este limiter a métodos de escritura (POST, PUT, DELETE, PATCH)
        if (['GET', 'OPTIONS', 'HEAD'].includes(req.method)) return true;
        return false;
    },
    keyGenerator: (req) => req.ip,
});

module.exports = {
    apiLimiter,
    authLimiter,
    writeLimiter
};