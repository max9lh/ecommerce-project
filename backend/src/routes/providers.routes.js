const { Router } = require('express');
const { getAllProviders, createProvider, updateProvider, deleteProvider } = require('../controllers/providers.controller');
const authGuard = require('../middlewares/authGuard');
const { validate, providerSchema } = require('../utils/schemas');
const requirePermission = require('../middlewares/requirePermission');

const router = Router();

router.get('/', authGuard, requirePermission('canManageProviders'),getAllProviders);

router.post('/', authGuard, requirePermission('canManageProviders'), validate(providerSchema), createProvider);

router.put('/:id', authGuard, requirePermission('canManageProviders'), validate(providerSchema), updateProvider);

router.delete('/:id', authGuard, requirePermission('canManageProviders'), deleteProvider);

module.exports = router;