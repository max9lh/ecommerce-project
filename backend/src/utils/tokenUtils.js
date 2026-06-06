// backend/src/utils/tokenUtils.js
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

/**
 * Genera un JWT Access Token
 * @param {number} userId - ID del usuario
 * @param {object} payload - Datos adicionales del usuario
 * @returns {string} Token JWT
 */
function generateAccessToken(userId, payload = {}) {
    const JWT_SECRET = process.env.JWT_SECRET;
    const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';

    return jwt.sign(
        {
            id: userId,
            ...payload,
            type: 'access'  // ✅ TIPO para diferenciar
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
}

/**
 * Genera un Refresh Token JWT con nonce único
 * @param {number} userId - ID del usuario
 * @returns {string} Token JWT
 */
function generateRefreshToken(userId) {
    const REFRESH_SECRET = process.env.REFRESH_SECRET;
    const REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN || '30d';

    // Generar token con nonce único
    const token = jwt.sign(
        {
            id: userId,
            type: 'refresh',  // ✅ TIPO para diferenciar
            nonce: crypto.randomBytes(16).toString('hex')
        },
        REFRESH_SECRET,
        { expiresIn: REFRESH_EXPIRES_IN }
    );

    return token;
}

/**
 * Hash seguro de un refresh token
 * @param {string} token - Token en texto plano
 * @returns {string} Hash SHA256
 */
function hashRefreshToken(token) {
    return crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');
}

/**
 * Verifica y decodifica un JWT
 * @param {string} token - Token JWT
 * @param {string} secret - Secret para verificar
 * @returns {object|null} Payload del token o null si es inválido
 */
function verifyToken(token, secret) {
    try {
        return jwt.verify(token, secret);
    } catch (error) {
        return null;
    }
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    hashRefreshToken,
    verifyToken
};