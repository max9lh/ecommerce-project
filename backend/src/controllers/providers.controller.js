const providerService = require('../services/providers.service');

const getAllProviders = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const providers = await providerService.getAllProviders(userId);
        return res.status(200).json(providers);
    } catch (error) {
        next(error);
    }
};

const createProvider = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { name, payment_condition, credit_days } = req.body;


        const newProvider = await providerService.createProvider(userId, {
            name,
            paymentCondition: payment_condition,
            creditDays: credit_days
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

        if (isNaN(id) || parseInt(id) <= 0) {
            const error = new Error('El ID del proveedor debe ser un numero positivo');
            error.statusCode = 400;
            throw error;
        }

        const { name, payment_condition, credit_days } = req.body;

        const updatedProvider = await providerService.updateProvider(userId, id, {
            name,
            paymentCondition: payment_condition,
            creditDays: credit_days
        });

        return res.status(200).json({
            message: "El proveedor se actualizo correctamente",
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

        if (isNaN(id) || parseInt(id) <= 0) {
            const error = new Error('El ID del proveedor debe ser un numero positivo');
            error.statusCode = 400;
            throw error;
        }

        await providerService.deleteProvider(userId, id);

        return res.status(200).json({
            message: "Se eliminó el proveedor correctamente"
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