const { Router } = require('express');
const { register, login, updatePercentages } = require('../controllers/auth.controller');
const { validate, registerSchema, loginSchema, updatePercentagesSchema } = require('../utils/schemas');
const authGuard = require('../middlewares/authGuard');

const router = Router();

// POST /api/auth/register
router.post('/register', validate(registerSchema), register);

router.post('/login', validate(loginSchema), login);

router.put('/percentages', authGuard, validate(updatePercentagesSchema), updatePercentages);

module.exports = router;
