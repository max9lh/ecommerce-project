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
        
        const updatedExpense = await expenseService.payExpense(req.user.id, parseInt(id));
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
        const expenses = await expenseService.getUpcomingExpenses(req.user.id);
        return res.status(200).json(expenses);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createExpense,
    payExpense,
    getExpenses,
    getUpcomingExpenses
}

