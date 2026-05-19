const prisma = require('../config/db');

const getAllProviders = async (userId) => {
    const providers = await prisma.provider.findMany({ where: { user_id: userId }, });
    return providers;
}

const createProvider = async (userId, providerData) => {
    const { name, paymentCondition, creditDays } = providerData;
    const existing = await prisma.provider.findFirst({ where: { user_id: userId, name } });
    if (existing) {
        const error = new Error('El proveedor ya esta en la lista');
        error.statusCode = 409;
        throw error;
    }

    return await prisma.provider.create({
        data: {
            user_id: userId,
            name,
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

    const affected = await prisma.provider.updateMany({
        where: {
            id: parseInt(id),
            user_id: userId
        },
        data: {
            name,
            payment_condition: paymentCondition,
            credit_days: creditDays,
        }
    })

    if (affected.count === 0) {
        const error = new Error('No se encontro el proveedor');
        error.statusCode = 404;
        throw error;
    }

    return { id: parseInt(id), name, paymentCondition, creditDays };
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

module.exports = { getAllProviders, createProvider, updateProvider, deleteProvider };