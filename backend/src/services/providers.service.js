const prisma = require('../config/db');

const getAllProviders = async (userId) => {
    const providers = await prisma.provider.findMany({
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

    const existing = await prisma.provider.findFirst({ where: { name: upperName } });
    if (existing) {
        const error = new Error('El proveedor ya esta en la lista');
        error.statusCode = 409;
        throw error;
    }

    const { getAdminContext } = require('../utils/adminContext');
    const adminCtx = await getAdminContext();

    return await prisma.$transaction(async (tx) => {
        const provider = await tx.provider.create({
            data: {
                user_id: adminCtx.adminId, // Siempre bajo el admin (dueño del negocio)
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

        await tx.auditLog.create({
            data: {
                user_id: userId,
                action: 'CREAR_PROVEEDOR',
                details: `Creó el proveedor "${upperName}" (Condición: ${paymentCondition}, Días de crédito: ${creditDays})`
            }
        });

        return provider;
    });
}

const updateProvider = async (userId, id, providerData) => {
    const { name, paymentCondition, creditDays } = providerData;
    const upperName = name.trim().toUpperCase();

    const existing = await prisma.provider.findFirst({
        where: {
            id: parseInt(id)
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
            id: { not: parseInt(id) }
        }
    });
    if (nameExists) {
        const error = new Error('El proveedor ya esta en la lista');
        error.statusCode = 409;
        throw error;
    }

    return await prisma.$transaction(async (tx) => {
        await tx.provider.update({
            where: { id: parseInt(id) },
            data: {
                name: upperName,
                payment_condition: paymentCondition,
                credit_days: creditDays,
            }
        });

        await tx.auditLog.create({
            data: {
                user_id: userId,
                action: 'MODIFICAR_PROVEEDOR',
                details: `Modificó el proveedor ID ${id} (Nombre: "${upperName}", Condición: ${paymentCondition}, Días de crédito: ${creditDays})`
            }
        });

        return { id: parseInt(id), name: upperName, payment_condition: paymentCondition, credit_days: creditDays };
    });
}

const deleteProvider = async (userId, id) => {
    const providerToDelete = await prisma.provider.findFirst({
        where: { id: parseInt(id) }
    });
    if (!providerToDelete) {
        const error = new Error('No se encontró el proveedor');
        error.statusCode = 404;
        throw error;
    }
    if (providerToDelete.name.endsWith(' (ELIMINADO)')) {
        const error = new Error('Este proveedor ya ha sido eliminado');
        error.statusCode = 400;
        throw error;
    }

    // 1. Verificar si hay egresos PENDIENTES asociados a este proveedor
    const pendingExpenses = await prisma.expense.count({
        where: {
            provider_id: parseInt(id),
            status: 'Pendiente'
        }
    });

    if (pendingExpenses > 0) {
        const error = new Error('No se puede eliminar el proveedor porque tiene pagos pendientes asociados');
        error.statusCode = 400;
        throw error;
    }

    // 2. Si hay egresos ya PAGADOS, los conservamos cambiándole el nombre a "NOMBRE (ELIMINADO)"
    const paidExpensesCount = await prisma.expense.count({
        where: {
            provider_id: parseInt(id),
            status: 'Pagado'
        }
    });

    return await prisma.$transaction(async (tx) => {
        let isSoft = false;
        if (paidExpensesCount > 0) {
            // Renombrar el proveedor agregando "(ELIMINADO)"
            const newName = `${providerToDelete.name.slice(0, 85)} (ELIMINADO)`;
            await tx.provider.update({
                where: { id: parseInt(id) },
                data: {
                    name: newName
                }
            });
            isSoft = true;
        } else {
            // Si no tiene ningún egreso (ni pendiente ni pago), lo podemos eliminar físicamente de la DB
            await tx.provider.delete({
                where: { id: parseInt(id) }
            });
        }

        await tx.auditLog.create({
            data: {
                user_id: userId,
                action: 'ELIMINAR_PROVEEDOR',
                details: `${isSoft ? 'Eliminó lógicamente (renombró)' : 'Eliminó físicamente'} el proveedor "${providerToDelete.name}" (ID ${id})`
            }
        });

        return { id: parseInt(id), success: true, softDeleted: isSoft };
    });
}

module.exports = {
    getAllProviders,
    createProvider,
    updateProvider,
    deleteProvider
};