const prisma = require('../config/db');
const { getAdminContext } = require('../utils/adminContext');

/**
 * Obtiene las cuentas físicas y balances del Administrador del negocio
 */
const getBalances = async (user_id) => {
    const adminCtx = await getAdminContext();
    return prisma.account.findMany({
        where: {
            user_id: adminCtx.adminId
        },
        select: {
            id: true,
            name: true,
            balance: true
        }
    });
};

/**
 * Obtiene las bolsas virtuales de presupuesto acumuladas
 */
const getBudgetBalances = async (user_id) => {
    const adminCtx = await getAdminContext();
    return prisma.budgetBalance.findMany({
        where: {
            user_id: adminCtx.adminId
        },
        select: {
            category: true,
            balance: true
        }
    });
};

/**
 * Crea una nueva cuenta física (banco, caja, etc.) asociada al admin
 */
const createAccount = async (user_id, body) => {
    const adminCtx = await getAdminContext();
    const { name, balance } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
        const err = new Error('El nombre de la cuenta es obligatorio.');
        err.status = 400;
        throw err;
    }

    // Evitar duplicados por nombre (case-insensitive)
    const existing = await prisma.account.findFirst({
        where: {
            user_id: adminCtx.adminId,
            name: { equals: name.trim(), mode: 'insensitive' }
        }
    });

    if (existing) {
        const err = new Error(`Ya existe una cuenta con el nombre "${name.trim()}".`);
        err.status = 409;
        throw err;
    }

    return prisma.account.create({
        data: {
            user_id: adminCtx.adminId,
            name: name.trim().toUpperCase(),
            balance: balance !== undefined ? parseFloat(balance) : 0
        }
    });
};

module.exports = {
    getBalances,
    getBudgetBalances,
    createAccount
};