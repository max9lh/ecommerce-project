const { Router } = require('express');
const {
    createAttendance,
    getAllAttendance,
    getMyAttendance,
    getSummary,
    updateAttendance,
    removeAttendance,
    liquidatePayroll,
    checkIn,
    checkOut,
    getStatus
} = require('../controllers/attendance.controller');
const { validate, createAttendanceSchema, updateAttendanceSchema, liquidatePayrollSchema } = require('../utils/schemas');
const authGuard = require('../middlewares/authGuard');
const requireAdmin = require('../middlewares/requireAdmin');

const router = Router();

router.use(authGuard);

router.get('/me', getMyAttendance);
router.get('/status', getStatus);
router.post('/check-in', checkIn);
router.post('/check-out', checkOut);

router.post('/', requireAdmin, validate(createAttendanceSchema), createAttendance);
router.get('/', requireAdmin, getAllAttendance);
router.get('/summary', requireAdmin, getSummary);
router.put('/:id', requireAdmin, validate(updateAttendanceSchema), updateAttendance);
router.delete('/:id', requireAdmin, removeAttendance);
router.post('/liquidate', requireAdmin, validate(liquidatePayrollSchema), liquidatePayroll);

module.exports = router;
