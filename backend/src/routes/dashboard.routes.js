const { Router } = require('express');
const { getSummary } = require('../controllers/dashboard.controller');
const authGuard = require('../middlewares/authGuard');
const requireAdmin = require('../middlewares/requireAdmin');

const router = Router();

router.get('/summary', authGuard, requireAdmin, getSummary);

module.exports = router;
