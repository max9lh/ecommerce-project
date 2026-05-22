const prisma = require('../config/db');

const getAdminContext = async () => {
    const admin = await prisma.user.findFirst({
        where: { role: 'ADMIN'},
        include: {
            accounts: true,
            budget_balances: true
        }
    });

    if (!admin) {
        const error = new Error('Configuración inválida: No existe un administrador en el sistema.');
        error.statusCode = 500;
        throw error;
    }

    return {
        adminId: admin.id,
        pct: {
            merchandise: Number(admin.pct_merchandise),
            fixed_expenses: Number(admin.pct_fixed_expenses),
            savings: Number(admin.pct_savings)
        },
        accounts: admin.accounts,
        budgets: admin.budget_balances 
    };
}

module.exports = { getAdminContext };