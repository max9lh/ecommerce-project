const { Router } = require('express');
const {
    createEmployee,
    getEmployees,
    updateEmployeePermissions,
    updateEmployeeProfile,
    deleteEmployee,
    getDistribution,
    updateDistribution
} = require('../controllers/admin.controller.js');
const authGuard = require('../middlewares/authGuard.js');
const requireAdmin = require('../middlewares/requireAdmin.js');
const {
    validate,
    createEmployeeSchema,
    updatePermissionsSchema,
    updateProfileSchema
} = require('../utils/schemas');

const router = Router();

router.use(authGuard, requireAdmin);

router.post('/employees', validate(createEmployeeSchema), createEmployee);
router.get('/employees', getEmployees);
router.put('/employees/:id/permissions', validate(updatePermissionsSchema), updateEmployeePermissions);
router.put('/employees/:id/profile', validate(updateProfileSchema), updateEmployeeProfile);
router.delete('/employees/:id', deleteEmployee);

router.get('/distribution', getDistribution);
router.put('/distribution', updateDistribution);

module.exports = router;