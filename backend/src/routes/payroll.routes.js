const { Router } = require('express');
const authGuard = require('../middlewares/authGuard');
const requireAdmin = require('../middlewares/requireAdmin');
const payrollController = require('../controllers/payroll.controller');

const router = Router();

// Todos los endpoints requieren autenticación + rol ADMIN
router.use(authGuard, requireAdmin);

// POST /api/payroll/advance — Registrar adelanto de sueldo
router.post('/advance', payrollController.registerAdvance);

// POST /api/payroll/process — Procesar nómina mensual
router.post('/process', payrollController.processPayroll);

module.exports = router;
