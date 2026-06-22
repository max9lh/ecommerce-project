// backend/src/controllers/auth.controller.js
const authService = require('../services/auth.service');
const authGuard = require('../middlewares/authGuard');

// Opciones de la cookie para el refresh token
const COOKIE_OPTIONS = {
    httpOnly: true,                                        // No accesible desde JS
    secure: process.env.NODE_ENV === 'production',         // Solo HTTPS en prod
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' para cross-domain en prod, 'lax' en dev
    path: '/',                                             // Disponible en toda la app
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
        const result = await authService.login(req.body);

        // ✅ Setear refresh token como HttpOnly cookie usando opciones unificadas
        res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);

        // ✅ Solo devolver accessToken en JSON
        return res.status(200).json({
            status: 'success',
            message: 'Login exitoso',
            data: {
                user: result.user,
                accessToken: result.accessToken,
                expiresIn: result.expiresIn
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
        // ✅ El refresh token viene en la cookie (automático con withCredentials)
        const refreshTokenFromCookie = req.cookies.refreshToken;

        if (!refreshTokenFromCookie) {
            const error = new Error('Refresh token no encontrado en cookies');
            error.statusCode = 401;
            return next(error);
        }

        // ✅ Llamar al servicio para generar nuevo access token
        const result = await authService.refreshAccessToken(refreshTokenFromCookie);

        // ✅ Setear NUEVA cookie con nuevo refresh token (rotation) usando opciones unificadas
        res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);

        // ✅ Devolver nuevo access token
        return res.status(200).json({
            status: 'success',
            message: 'Token refrescado',
            data: {
                accessToken: result.accessToken,
                expiresIn: result.expiresIn
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

        // Limpiar la cookie usando las opciones unificadas
        res.clearCookie('refreshToken', COOKIE_OPTIONS);

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

const changePassword = async (req, res, next) => {
    try {
        const result = await authService.changePassword({
            userId: req.user.id,
            currentPassword: req.body.currentPassword,
            newPassword: req.body.newPassword,
        });

        // ✅ Invalida la caché en memoria para que el authGuard vuelva a leer de la DB
        // y detecte que must_change_password ahora es false.
        authGuard.invalidateUserCache(req.user.id);

        res.status(200).json({
            status: 'success',
            message: result.message,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { register, login, refreshToken, logout, updatePercentages, changePassword };
