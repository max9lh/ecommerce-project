const { Router } = require('express');
const { createExpense, payExpense, getExpenses, getUpcomingExpenses } = require('../controllers/expense.controller');
const { validate, expensesSchema } = require('../utils/schemas');
const authGuard = require('../middlewares/authGuard');

const router = Router();

router.use(authGuard);

router.route('/')
    .get(getExpenses)
    .post(validate(expensesSchema), createExpense);

router.get('/upcoming', getUpcomingExpenses);

router.put('/:id/pay', payExpense);

module.exports = router;
