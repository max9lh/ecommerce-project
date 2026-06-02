const { Router } = require('express');
const { getBalances, getBudgetBalances, createBalances } = require('../controllers/accounts.controller');
const authGuard = require('../middlewares/authGuard');
const requireAdmin = require('../middlewares/requireAdmin')

const router = Router();

router.post('/', authGuard, createBalances);
router.get('/', authGuard, getBalances);
router.get('/budget-balances', authGuard, requireAdmin, getBudgetBalances);


module.exports = router;