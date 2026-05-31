const { Router } = require('express');
const { getAllProviders, createProvider, updateProvider, deleteProvider } = require('../controllers/providers.controller');
const authGuard = require('../middlewares/authGuard');
const { validate, providerSchema } = require('../utils/schemas');
const requirePermission = require('../middlewares/requirePermission');
const requireAdmin = require('../middlewares/requireAdmin');

const router = Router();

router.get('/', authGuard, requirePermission('canManageProviders', 'canRegisterExpenses', 'canPayExpenses'),getAllProviders);

router.post('/', authGuard, requirePermission('canManageProviders'), validate(providerSchema), createProvider);

router.put('/:id', authGuard, requirePermission('canManageProviders'), validate(providerSchema), updateProvider);

router.delete('/:id', authGuard, requireAdmin, deleteProvider);

module.exports = router;