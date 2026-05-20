const accountsService = require('../services/accounts.service');

const getBalances = async (req, res, next) => {
    try {
        const balances = await accountsService.getBalances(req.user.id);
        return res.status(200).json({ data: balances });
    } catch (error) {
        next(error);
    }
}

module.exports = { getBalances };
