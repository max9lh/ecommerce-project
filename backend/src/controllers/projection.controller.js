const projectionService = require('../services/projectionService');

const getProjection = async (req, res, next) => {
    try {
        const { days, basePeriod, safetyBuffer, from, to } = req.query;

        let basePeriodDays = parseInt(basePeriod, 10) || 14;

        // Si hay rango personalizado, usar from/to
        if (from && to) {
            basePeriodDays = {
                from: new Date(from),
                to: new Date(to)
            };
        }

        const result = await projectionService.generateProjection({
            userId: req.user.id,
            days: parseInt(days, 10) || 30,
            basePeriodDays,
            safetyBuffer: parseFloat(safetyBuffer) || 0
        });

        res.json({ success: true, data: result });
    } catch (err) {
        next(err);
    }
};

module.exports = { getProjection };
