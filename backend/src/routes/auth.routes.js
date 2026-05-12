const { Router } = require('express');
const { register, login } = require('../controllers/auth.controller');
const { validate, registerSchema, loginSchema } = require('../utils/schemas');

const router = Router();

// POST /api/auth/register
router.post('/register', validate(registerSchema), register);

router.post('/login', validate(loginSchema), login);

module.exports = router;
