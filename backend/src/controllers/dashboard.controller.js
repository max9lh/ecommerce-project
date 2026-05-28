const dashboardService = require('../services/dashboard.service');

const getSummary = async (req, res, next) => {
    try {
        const months = req.query.months ? parseInt(req.query.months) : 6;

        const [incomeVsExpenses, recentActivity] = await Promise.all([
            dashboardService.getIncomeVsExpenses(months),
            dashboardService.getRecentActivity(10),
        ]);

        return res.status(200).json({
            incomeVsExpenses,
            recentActivity,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getSummary };

