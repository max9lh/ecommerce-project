const expenseService = require('../services/expense.service');

const createExpense = async (req, res, next) => {
    try {
        const newExpense = await expenseService.createExpense(req.user.id, req.body);
        return res.status(201).json(newExpense);
    } catch (error) {
        next(error);
    }
};

const payExpense = async (req, res, next) => {
    try {
        const { id } = req.params;
        const account_id = req.body?.account_id;

        const updatedExpense = await expenseService.payExpense(req.user.id, parseInt(id), account_id);
        return res.status(200).json({
            message: 'Gasto actualizado exitosamente',
            data: updatedExpense
        });

    } catch (error) {
        next(error);
    }
};

const getExpenses = async (req, res, next) => {
    try {
        const expenses = await expenseService.getExpenses(req.user.id, req.query);
        return res.status(200).json(expenses);
    } catch (error) {
        next(error);
    }
};

const getUpcomingExpenses = async (req, res, next) => {
    try {
        const days = req.query.days ? parseInt(req.query.days) : 15;
        const expenses = await expenseService.getUpcomingExpenses(req.user.id, days);
        return res.status(200).json(expenses);
    } catch (error) {
        next(error);
    }
};

const deleteExpense = async (req, res, next) => {
    try {
        const { id } = req.params;
        await expenseService.deleteExpense(id);
        return res.status(200).json({ message: 'Gasto eliminado exitosamente' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createExpense,
    payExpense,
    getExpenses,
    getUpcomingExpenses,
    deleteExpense
}

