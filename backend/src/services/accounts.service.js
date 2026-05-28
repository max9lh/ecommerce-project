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

module.exports = {
    getBalances,
    getBudgetBalances
};