const { Router } = require('express');
const { createExpense, payExpense, getExpenses, getUpcomingExpenses, deleteExpense } = require('../controllers/expense.controller');
const { validate, expensesSchema } = require('../utils/schemas');
const authGuard = require('../middlewares/authGuard');
const requirePermission = require('../middlewares/requirePermission');
const requireAdmin = require('../middlewares/requireAdmin');

const router = Router();

router.use(authGuard);

router.route('/').get(requireAdmin, getExpenses).post(requirePermission('canRegisterExpenses'), validate(expensesSchema), createExpense);

router.get('/upcoming', requireAdmin, getUpcomingExpenses);

router.put('/:id/pay', requirePermission('canPayExpenses'), payExpense);
router.delete('/:id', requireAdmin, deleteExpense);

module.exports = router;
