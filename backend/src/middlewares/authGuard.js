// backend/src/middlewares/authGuard.js
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

// Caché simple en memoria
const userCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

const authGuard = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        const error = new Error('No autorizado');
        error.statusCode = 401;
        return next(error);
    }

    const token = authHeader.split(' ')[1];
    const JWT_SECRET = process.env.JWT_SECRET;

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // Buscar en caché primero
        const cacheKey = `user:${decoded.id}`;
        let user = userCache.get(cacheKey);

        if (!user || user.expiry < Date.now()) {
            // Si no está en caché o expiró, buscar en BD
            user = await prisma.user.findFirst({
                where: { id: decoded.id, deleted_at: null }
            });

            if (user) {
                userCache.set(cacheKey, {
                    ...user,
                    expiry: Date.now() + CACHE_TTL
                });
            }
        }

        if (!user) {
            const error = new Error('El usuario del token ya no existe');
            error.statusCode = 401;
            return next(error);
        }

        req.user = { ...decoded, role: user.role };
        next();
    } catch (err) {
        const error = new Error('Token inválido');
        error.statusCode = 401;
        return next(error);
    }
};

module.exports = authGuard;