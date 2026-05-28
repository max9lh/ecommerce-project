const { Router } = require('express');
const { createClosure, getClosures } = require('../controllers/closure.controller');
const { validate, dailyClosureSchema } = require('../utils/schemas');
const authGuard = require('../middlewares/authGuard');
const requirePermission = require('../middlewares/requirePermission');


const router = Router();

router.post('/', authGuard, requirePermission('canRegisterClosures'), validate(dailyClosureSchema), createClosure);
router.get('/', authGuard, requirePermission('canRegisterClosures'), getClosures);

module.exports = router;