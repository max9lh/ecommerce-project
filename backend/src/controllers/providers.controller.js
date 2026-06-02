const providerService = require('../services/providers.service');

const getAllProviders = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        const page = req.query.page ? parseInt(req.query.page, 10) : null;
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : null;

        const result = await providerService.getAllProviders(userId, userRole, page, limit);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const createProvider = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { name, payment_condition, credit_days, visible_to_employee } = req.body;

        // "Traduce" de snake_case (frontend) a camelCase (lo que espera el servicio seguro)
        const newProvider = await providerService.createProvider(userId, {
            name,
            paymentCondition: payment_condition,
            creditDays: credit_days,
            visibleToEmployee: visible_to_employee
        });

        return res.status(201).json(newProvider);
    } catch (error) {
        next(error);
    }
};

const updateProvider = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const providerId = parseInt(id, 10);

        if (isNaN(providerId) || providerId <= 0) {
            const error = new Error('El ID del proveedor debe ser un número positivo');
            error.statusCode = 400;
            throw error;
        }

        const { name, payment_condition, credit_days, visible_to_employee } = req.body;

        const updatedProvider = await providerService.updateProvider(userId, providerId, {
            name,
            paymentCondition: payment_condition,
            creditDays: credit_days,
            visibleToEmployee: visible_to_employee
        });

        return res.status(200).json({
            message: "El proveedor se actualizó correctamente",
            data: updatedProvider
        });
    } catch (error) {
        next(error);
    }
};

const deleteProvider = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const providerId = parseInt(id, 10);

        if (isNaN(providerId) || providerId <= 0) {
            const error = new Error('El ID del proveedor debe ser un número positivo');
            error.statusCode = 400;
            throw error;
        }

        const result = await providerService.deleteProvider(userId, providerId);

        return res.status(200).json({
            message: "Se procesó la baja del proveedor correctamente",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllProviders,
    createProvider,
    updateProvider,
    deleteProvider
};