// backend/src/controllers/auth.controller.js
const authService = require('../services/auth.service');

// Opciones de la cookie para el refresh token
const COOKIE_OPTIONS = {
    httpOnly: true,                                        // No accesible desde JS
    secure: process.env.NODE_ENV === 'production',         // Solo HTTPS en prod
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/api/auth',                                     // Solo se envía a rutas de auth
    maxAge: 30 * 24 * 60 * 60 * 1000,                      // 30 días en ms
};

const register = async (req, res, next) => {
    try {
        const user = await authService.register(req.body);
        res.status(201).json({
            status: 'success',
            message: 'Usuario registrado correctamente',
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { user, accessToken, refreshToken, expiresIn } = await authService.login(req.body);

        // Setear refresh token en HttpOnly cookie
        res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

        res.status(200).json({
            status: 'success',
            message: 'Login exitoso',
            data: {
                user,
                accessToken,
                expiresIn
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Refresca los tokens — lee el refresh token desde la cookie
 */
const refreshToken = async (req, res, next) => {
    try {
        const token = req.cookies?.refreshToken;

        if (!token) {
            const error = new Error('Refresh token no encontrado');
            error.statusCode = 401;
            return next(error);
        }

        const { accessToken, refreshToken: newRefreshToken, expiresIn } =
            await authService.refreshAccessToken(token);

        // Rotar la cookie con el nuevo refresh token
        res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS);

        res.status(200).json({
            status: 'success',
            message: 'Tokens renovados',
            data: {
                accessToken,
                expiresIn
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Logout: revoca el refresh token y limpia la cookie
 */
const logout = async (req, res, next) => {
    try {
        await authService.logout(req.user.id);

        // Limpiar la cookie
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            path: '/api/auth',
        });

        res.status(200).json({
            status: 'success',
            message: 'Logout exitoso'
        });
    } catch (error) {
        next(error);
    }
};

const updatePercentages = async (req, res, next) => {
    try {
        const user = await authService.updatePercentages({ userId: req.user.id, ...req.body });
        res.status(200).json({
            status: 'success',
            message: 'Porcentajes actualizados',
            data: user,
        })
    } catch (error) {
        next(error);
    }
};

module.exports = { register, login, refreshToken, logout, updatePercentages };