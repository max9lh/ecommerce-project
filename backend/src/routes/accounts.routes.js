const { Router } = require('express');
const { getBalances } = require('../controllers/accounts.controller');
const authGuard = require('../middlewares/authGuard');


const router = Router();

router.get('/', authGuard, getBalances);

module.exports = router;