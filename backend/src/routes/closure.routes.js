const { Router } = require('express');
const { createClosure } = require('../controllers/closure.controller');
const { validate, dailyClosureSchema } = require('../utils/schemas');
const authGuard = require('../middlewares/authGuard');

const router = Router();

router.post('/', authGuard, validate(dailyClosureSchema), createClosure);

module.exports = router;