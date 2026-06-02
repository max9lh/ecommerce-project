const dashboardService = require('../services/dashboard.service');

const getSummary = async (req, res, next) => {
    try {
        const months = req.query.months ? parseInt(req.query.months) : 6;

        const [incomeVsExpenses, recentActivity, accountHistory] = await Promise.all([
            dashboardService.getIncomeVsExpenses(months),
            dashboardService.getRecentActivity(10),
            dashboardService.getAccountHistory(months),
        ]);

        return res.status(200).json({
            incomeVsExpenses,
            recentActivity,
            accountHistory,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getSummary };

