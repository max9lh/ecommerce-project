const prisma = require('../config/db');

const getAllProviders = async (userId) => {
    const providers = await prisma.provider.findMany({
        where: { user_id: userId },
        select: {
            id: true,
            name: true,
            payment_condition: true,
            credit_days: true,
        }
    });
    return providers;
}

const createProvider = async (userId, providerData) => {
    const { name, paymentCondition, creditDays } = providerData;
    const upperName = name.trim().toUpperCase();

    const existing = await prisma.provider.findFirst({ where: { user_id: userId, name: upperName } });
    if (existing) {
        const error = new Error('El proveedor ya esta en la lista');
        error.statusCode = 409;
        throw error;
    }

    return await prisma.provider.create({
        data: {
            user_id: userId,
            name: upperName,
            payment_condition: paymentCondition,
            credit_days: creditDays,
        },
        select: {
            id: true,
            name: true,
            payment_condition: true,
            credit_days: true,
        }
    });
}

const updateProvider = async (userId, id, providerData) => {
    const { name, paymentCondition, creditDays } = providerData;
    const upperName = name.trim().toUpperCase();

    const existing = await prisma.provider.findFirst({
        where: {
            id: parseInt(id),
            user_id: userId
        }
    });
    if (!existing) {
        const error = new Error('No se encontro el proveedor');
        error.statusCode = 404;
        throw error;
    }
    const nameExists = await prisma.provider.findFirst({
        where: {
            name: upperName,
            user_id: userId,
            id: { not: parseInt(id) }
        }
    });
    if (nameExists) {
        const error = new Error('El proveedor ya esta en la lista');
        error.statusCode = 409;
        throw error;
    }
    const affected = await prisma.provider.updateMany({
        where: {
            id: parseInt(id),
            user_id: userId
        },
        data: {
            name: upperName,
            payment_condition: paymentCondition,
            credit_days: creditDays,
        }
    })

    if (affected.count === 0) {
        const error = new Error('No se encontro el proveedor');
        error.statusCode = 404;
        throw error;
    }

    return { id: parseInt(id), name: upperName, payment_condition: paymentCondition, credit_days: creditDays };
}

const deleteProvider = async (userId, id) => {
    const affected = await prisma.provider.deleteMany({
        where: {
            id: parseInt(id),
            user_id: userId
        },
    });

    if (affected.count === 0) {
        const error = new Error('No se encontro el proveedor');
        error.statusCode = 404;
        throw error;
    }

    return { id: parseInt(id), success: true };
}

module.exports = {
    getAllProviders,
    createProvider,
    updateProvider,
    deleteProvider
};