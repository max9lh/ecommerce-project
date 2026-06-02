const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

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
        
        const user = await prisma.user.findFirst({
            where: { id: decoded.id, deleted_at: null }
        });

        if (!user) {
            const error = new Error('El usuario del token ya no existe en la base de datos');
            error.statusCode = 401;
            return next(error);
        }

        req.user = { ...decoded, role: user.role };
        next();
    } catch (err) {
        const error = new Error('Token invalido');
        error.statusCode = 401;
        return next(error);
    }
};

module.exports = authGuard;