const { Router } = require('express');
const authGuard = require('../middlewares/authGuard');
const requireAdmin = require('../middlewares/requireAdmin');
const controller = require('../controllers/recurringExpense.controller');

const router = Router();

// Todos los endpoints requieren autenticación + rol ADMIN
router.use(authGuard, requireAdmin);

// CRUD de gastos recurrentes
router.get('/', controller.getAll);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
