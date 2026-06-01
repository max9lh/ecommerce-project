const { Router } = require('express');
const authGuard = require('../middlewares/authGuard');
const requireAdmin = require('../middlewares/requireAdmin');
const projectionController = require('../controllers/projection.controller');

const router = Router();

// GET /api/projection — Obtener proyección de caja
router.get('/', authGuard, requireAdmin, projectionController.getProjection);

module.exports = router;
