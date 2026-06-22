// backend/src/routes/auth.routes.js
const { Router } = require('express');
const { register, login, refreshToken, logout, updatePercentages, changePassword } = require('../controllers/auth.controller');
const { forgotPassword, resetPassword } = require('../controllers/passwordReset.controller');
const { validate, registerSchema, loginSchema, updatePercentagesSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema } = require('../utils/schemas');
const authGuard = require('../middlewares/authGuard');
const { authLimiter } = require('../middlewares/rateLimiter');

const router = Router();

// POST /api/auth/register
router.post('/register', authLimiter, validate(registerSchema), register);

// POST /api/auth/login
router.post('/login', authLimiter, validate(loginSchema), login);

// POST /api/auth/refresh (refresh token viene por HttpOnly cookie, no por body)
router.post('/refresh', refreshToken);

// ✅ POST /api/auth/logout
router.post('/logout', authGuard, logout);

// PUT /api/auth/percentages
router.put('/percentages', authGuard, validate(updatePercentagesSchema), updatePercentages);

// ============================================================
// RECUPERACIÓN DE CONTRASEÑA (Público — sin authGuard)
// ============================================================

// POST /api/auth/forgot-password — Solicita email de recuperación
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);

// POST /api/auth/reset-password — Restablece la contraseña con token
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPassword);

// ============================================================
// CAMBIO DE CONTRASEÑA (Protegido — requiere authGuard)
// ============================================================

// POST /api/auth/change-password — Cambio de contraseña temporal (primer login)
router.post('/change-password', authGuard, authLimiter, validate(changePasswordSchema), changePassword);

module.exports = router;
