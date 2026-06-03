// backend/src/routes/auth.routes.js
const { Router } = require('express');
const { register, login, refreshToken, logout, updatePercentages } = require('../controllers/auth.controller');
const { forgotPassword, resetPassword } = require('../controllers/passwordReset.controller');
const { validate, registerSchema, loginSchema, updatePercentagesSchema, forgotPasswordSchema, resetPasswordSchema } = require('../utils/schemas');
const authGuard = require('../middlewares/authGuard');

const router = Router();

// POST /api/auth/register
router.post('/register', validate(registerSchema), register);

// POST /api/auth/login
router.post('/login', validate(loginSchema), login);

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
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);

// POST /api/auth/reset-password — Restablece la contraseña con token
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

module.exports = router;