const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const authGuard = require('../middlewares/authGuard');
const requireAdmin = require('../middlewares/requireAdmin');
const {
    validate,
    createEmployeeSchema,
    updatePermissionsSchema,
    updateProfileSchema
} = require('../utils/schemas');

router.use(authGuard, requireAdmin);

router.post('/employees', validate(createEmployeeSchema), adminController.createEmployee);
router.get('/employees', adminController.getEmployees);
router.put('/employees/:id/permissions', validate(updatePermissionsSchema), adminController.updateEmployeePermissions);
router.put('/employees/:id/profile', validate(updateProfileSchema), adminController.updateEmployeeProfile);
router.delete('/employees/:id', adminController.deleteEmployee);

module.exports = router;