const { Router } = require('express');
const {
    getSummary,
    getCashFlow,
    getExpensesByCategory,
    getExpensesByProvider,
    getPayroll,
    getBudgetHealth
} = require('../controllers/reports.controller');
const authGuard = require('../middlewares/authGuard');
const requireAdmin = require('../middlewares/requireAdmin');

const router = Router();

// Todas las rutas de reportes requieren autenticación y rol ADMIN
router.use(authGuard, requireAdmin);

router.get('/summary', getSummary);
router.get('/cashflow', getCashFlow);
router.get('/expenses-by-category', getExpensesByCategory);
router.get('/expenses-by-provider', getExpensesByProvider);
router.get('/payroll', getPayroll);
router.get('/budget-health', getBudgetHealth);

module.exports = router;
