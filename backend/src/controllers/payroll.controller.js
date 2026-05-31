const payrollService = require('../services/payrollService');

const registerAdvance = async (req, res, next) => {
    try {
        const { employeeUserId, amount, accountId } = req.body;
        const result = await payrollService.registerAdvance({
            employeeUserId,
            amount,
            userId: req.user.id,
            accountId
        });
        res.status(201).json({ success: true, data: result });
    } catch (err) {
        next(err);
    }
};

const processPayroll = async (req, res, next) => {
    try {
        const results = await payrollService.processMonthlyPayroll({
            userId: req.user.id
        });
        res.json({ success: true, data: results });
    } catch (err) {
        next(err);
    }
};

module.exports = { registerAdvance, processPayroll };
