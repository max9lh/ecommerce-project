const reportsService = require('../services/reports.service');

const getSummary = async (req, res, next) => {
    try {
        const { from, to } = req.query;
        if (!from || !to) {
            return res.status(400).json({ message: 'Se requieren los parámetros "from" y "to" (YYYY-MM-DD)' });
        }
        const data = await reportsService.getPeriodSummary(from, to);
        return res.status(200).json(data);
    } catch (error) {
        next(error);
    }
};

const getCashFlow = async (req, res, next) => {
    try {
        const { from, to } = req.query;
        if (!from || !to) {
            return res.status(400).json({ message: 'Se requieren los parámetros "from" y "to" (YYYY-MM-DD)' });
        }
        const data = await reportsService.getCashFlow(from, to);
        return res.status(200).json(data);
    } catch (error) {
        next(error);
    }
};

const getExpensesByCategory = async (req, res, next) => {
    try {
        const { from, to } = req.query;
        if (!from || !to) {
            return res.status(400).json({ message: 'Se requieren los parámetros "from" y "to" (YYYY-MM-DD)' });
        }
        const data = await reportsService.getExpensesByCategory(from, to);
        return res.status(200).json(data);
    } catch (error) {
        next(error);
    }
};

const getExpensesByProvider = async (req, res, next) => {
    try {
        const { from, to } = req.query;
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        if (!from || !to) {
            return res.status(400).json({ message: 'Se requieren los parámetros "from" y "to" (YYYY-MM-DD)' });
        }
        const data = await reportsService.getExpensesByProvider(from, to, limit);
        return res.status(200).json(data);
    } catch (error) {
        next(error);
    }
};

const getPayroll = async (req, res, next) => {
    try {
        const { from, to } = req.query;
        if (!from || !to) {
            return res.status(400).json({ message: 'Se requieren los parámetros "from" y "to" (YYYY-MM-DD)' });
        }
        const data = await reportsService.getPayrollSummary(from, to);
        return res.status(200).json(data);
    } catch (error) {
        next(error);
    }
};

const getBudgetHealth = async (req, res, next) => {
    try {
        const data = await reportsService.getBudgetHealth();
        return res.status(200).json(data);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getSummary,
    getCashFlow,
    getExpensesByCategory,
    getExpensesByProvider,
    getPayroll,
    getBudgetHealth
};
