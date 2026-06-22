// backend/src/controllers/auth.controller.js
const authService = require('../services/auth.service');

// Opciones de la cookie para el refresh token
const COOKIE_OPTIONS = {
<<<<<<< HEAD
    httpOnly: true,                                        // No accesible desde JS
    secure: process.env.NODE_ENV === 'production',         // Solo HTTPS en prod
    sameSite: 'strict',                                    // Protege CSRF
    path: '/',                                             // Disponible en toda la app
    maxAge: 30 * 24 * 60 * 60 * 1000,                      // 30 días en ms
=======
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
>>>>>>> bbcfe4a019fae731e2f373f096b84a2a6bc213a1
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

<<<<<<< HEAD
        // ✅ Setear refresh token como HttpOnly cookie usando opciones unificadas
        res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);

        // ✅ Solo devolver accessToken en JSON
        return res.status(200).json({
=======
        res.cookie('refreshToken', result.refreshToken, {
            ...COOKIE_OPTIONS,
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });

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
        const refreshTokenFromCookie = req.cookies.refreshToken;

        if (!refreshTokenFromCookie) {
            const error = new Error('Refresh token no encontrado en cookies');
            error.statusCode = 401;
            return next(error);
        }

        const result = await authService.refreshAccessToken(refreshTokenFromCookie);

        res.cookie('refreshToken', result.refreshToken, {
            ...COOKIE_OPTIONS,
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });

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

        res.clearCookie('refreshToken', COOKIE_OPTIONS);

        res.status(200).json({
>>>>>>> bbcfe4a019fae731e2f373f096b84a2a6bc213a1
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

<<<<<<< HEAD
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
=======
const forceChangePassword = async (req, res, next) => {
    try {
        const result = await authService.forceChangePassword(req.user.id, req.body.newPassword);

        res.cookie('refreshToken', result.refreshToken, {
            ...COOKIE_OPTIONS,
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            status: 'success',
            message: 'Contraseña actualizada correctamente',
            data: {
                accessToken: result.accessToken,
                expiresIn: result.expiresIn
            }
>>>>>>> bbcfe4a019fae731e2f373f096b84a2a6bc213a1
        });
    } catch (error) {
        next(error);
    }
};

<<<<<<< HEAD
module.exports = { register, login, refreshToken, logout, updatePercentages, changePassword };
=======
module.exports = { register, login, refreshToken, logout, updatePercentages, forceChangePassword };
>>>>>>> bbcfe4a019fae731e2f373f096b84a2a6bc213a1
