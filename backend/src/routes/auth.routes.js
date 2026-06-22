<<<<<<< HEAD
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
=======
// backend/src/routes/auth.routes.js
const { Router } = require('express');
const { register, login, refreshToken, logout, updatePercentages, forceChangePassword } = require('../controllers/auth.controller');
const { forgotPassword, resetPassword } = require('../controllers/passwordReset.controller');
const { validate, registerSchema, loginSchema, updatePercentagesSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema } = require('../utils/schemas');
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

// POST /api/auth/change-password — Cambio forzado de contraseña (primer login)
router.post('/change-password', authGuard, validate(changePasswordSchema), forceChangePassword);

// ============================================================
// RECUPERACIÓN DE CONTRASEÑA (Público — sin authGuard)
// ============================================================

// POST /api/auth/forgot-password — Solicita email de recuperación
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);

// POST /api/auth/reset-password — Restablece la contraseña con token
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

module.exports = router;
>>>>>>> bbcfe4a019fae731e2f373f096b84a2a6bc213a1
