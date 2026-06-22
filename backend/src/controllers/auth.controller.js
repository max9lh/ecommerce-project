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
        const result = await authService.login(req.body);

        // ✅ Setear refresh token como HttpOnly cookie
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,                              // ← No accesible desde JS
            secure: process.env.NODE_ENV === 'production', // ← HTTPS en prod
            sameSite: 'strict',                          // ← Protege CSRF
            maxAge: 30 * 24 * 60 * 60 * 1000,           // ← 30 días en ms
            path: '/'                                     // ← Disponible en toda la app
        });

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

        // ✅ Setear NUEVA cookie con nuevo refresh token (rotation)
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000,
            path: '/'
        });

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

const changePassword = async (req, res, next) => {
    try {
        const result = await authService.changePassword({
            userId: req.user.id,
            currentPassword: req.body.currentPassword,
            newPassword: req.body.newPassword,
        });
        res.status(200).json({
            status: 'success',
            message: result.message,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { register, login, refreshToken, logout, updatePercentages, changePassword };
