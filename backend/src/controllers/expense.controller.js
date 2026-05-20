const expenseService = require('../services/expense.service');

const createExpense = async (req, res, next) => {
    try {
        const newExpense = await expenseService.createExpense(req.user.id, req.body);
        return res.status(201).json(newExpense);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createExpense
}

