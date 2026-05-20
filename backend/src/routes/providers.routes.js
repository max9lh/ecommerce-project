const { Router } = require('express');
const { getAllProviders, createProvider, updateProvider, deleteProvider } = require('../controllers/providers.controller');
const authGuard = require('../middlewares/authGuard');
const { validate, providerSchema } = require('../utils/schemas');


const router = Router();

router.get('/', authGuard, getAllProviders);

router.post('/', authGuard, validate(providerSchema), createProvider);

router.put('/:id', authGuard, validate(providerSchema), updateProvider);

router.delete('/:id', authGuard, deleteProvider);

module.exports = router;