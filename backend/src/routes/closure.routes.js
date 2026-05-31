const { Router } = require('express');
const { createClosure, getClosures, getClosureById, updateClosure } = require('../controllers/closure.controller');
const { validate, dailyClosureSchema } = require('../utils/schemas');
const authGuard = require('../middlewares/authGuard');
const requirePermission = require('../middlewares/requirePermission');
const requireAdmin = require('../middlewares/requireAdmin');

const router = Router();

router.post('/', authGuard, requirePermission('canRegisterClosures'), validate(dailyClosureSchema), createClosure);
router.get('/', authGuard, requirePermission('canRegisterClosures'), getClosures);
router.get('/:id', authGuard, requirePermission('canRegisterClosures'), getClosureById);
router.put('/:id', authGuard, requireAdmin, validate(dailyClosureSchema), updateClosure);

module.exports = router;