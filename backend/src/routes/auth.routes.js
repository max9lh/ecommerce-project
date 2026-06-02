// backend/src/routes/auth.routes.js
const { Router } = require('express');
const { register, login, refreshToken, logout, updatePercentages } = require('../controllers/auth.controller');
const { validate, registerSchema, loginSchema, updatePercentagesSchema } = require('../utils/schemas');
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

module.exports = router;