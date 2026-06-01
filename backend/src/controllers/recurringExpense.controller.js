const recurringExpenseService = require('../services/recurringExpense.service');

const getAll = async (req, res, next) => {
    try {
        const expenses = await recurringExpenseService.getRecurringExpenses();
        res.json({ success: true, data: expenses });
    } catch (err) {
        next(err);
    }
};

const create = async (req, res, next) => {
    try {
        const expense = await recurringExpenseService.createRecurringExpense(req.user.id, req.body);
        res.status(201).json({ success: true, data: expense });
    } catch (err) {
        next(err);
    }
};

const update = async (req, res, next) => {
    try {
        const expense = await recurringExpenseService.updateRecurringExpense(
            req.user.id,
            req.params.id,
            req.body
        );
        res.json({ success: true, data: expense });
    } catch (err) {
        next(err);
    }
};

const remove = async (req, res, next) => {
    try {
        const expense = await recurringExpenseService.deleteRecurringExpense(req.user.id, req.params.id);
        res.json({ success: true, data: expense });
    } catch (err) {
        next(err);
    }
};

module.exports = { getAll, create, update, remove };
