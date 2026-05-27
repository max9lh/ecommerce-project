const accountsService = require('../services/accounts.service');

const createBalances = async (req, res, next) => {
    try {
        const newBalances = await accountsService.createAccount(req.user.id, req.body);
        return res.status(201).json({ data: newBalances });
    } catch (error) {
        next(error);
    }
}

const getBalances = async (req, res, next) => {
    try {
        const balances = await accountsService.getBalances(req.user.id);
        return res.status(200).json({ data: balances });
    } catch (error) {
        next(error);
    }
}

const getBudgetBalances = async (req, res, next) => {
    try {
        const balances = await accountsService.getBudgetBalances(req.user.id);
        return res.status(200).json({ data: balances });
    } catch (error) {
        next(error);
    }
}

module.exports = { createBalances, getBalances, getBudgetBalances };
