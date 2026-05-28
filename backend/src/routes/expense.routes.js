const { Router } = require('express');
const {
    createExpense,
    payExpense,
    getExpenses,
    getUpcomingExpenses,
    deleteExpense
} = require('../controllers/expense.controller');
const { validate, expensesSchema } = require('../utils/schemas');
const authGuard = require('../middlewares/authGuard');
const requirePermission = require('../middlewares/requirePermission');
const requireAdmin = require('../middlewares/requireAdmin');

const router = Router();

// Todas las rutas de egresos requieren sesión activa
router.use(authGuard);


// Obtener egresos: Accesible para Administradores, Registradores y Pagadores
// Crear egreso: Solo para quienes tengan el permiso granular de registro activo
router.route('/')
    .get(requirePermission('canRegisterExpenses', 'canPayExpenses'), getExpenses)
    .post(requirePermission('canRegisterExpenses'), validate(expensesSchema), createExpense);


// Próximos vencimientos: Exclusivo del Administrador del negocio
router.get('/upcoming', requireAdmin, getUpcomingExpenses);

// Pagar egreso: Protegido por el permiso específico para efectuar pagos
router.put('/:id/pay', requirePermission('canPayExpenses'), payExpense);

// Eliminar egreso: Solo el Administrador puede borrar del registro histórico
router.delete('/:id', requireAdmin, deleteExpense);

module.exports = router;