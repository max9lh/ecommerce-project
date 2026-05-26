const prisma = require('../config/db');
const { getAdminContext } = require('../utils/adminContext');

const createExpense = async (userId, expenseData) => {
    const { provider_id, account_id, budget_category, amount, status, due_date } = expenseData;

    return await prisma.$transaction(async (tx) => {
        const adminCtx = await getAdminContext();

        const budget = await tx.budgetBalance.findUnique({
            where: {
                user_id_category: { user_id: adminCtx.adminId, category: budget_category }
            }
        });
        if (!budget) {
            const error = new Error(`La bolsa de presupuesto "${budget_category}" no existe`);
            error.statusCode = 404;
            throw error;
        }

        const finalStatus = status || 'Pendiente';

        if (finalStatus === 'Pagado') {
            const account = await tx.account.findUnique({
                where: { id: parseInt(account_id) }
            });

            if (!account) {
                const error = new Error('La cuenta física seleccionada no existe');
                error.statusCode = 404;
                throw error;
            }
            if (Number(account.balance) < Number(amount)) {
                const error = new Error('Saldo insuficiente en la cuenta física seleccionada');
                error.statusCode = 400;
                throw error;
            }
            if (Number(budget.balance) < Number(amount)) {
                const error = new Error(`Saldo insuficiente en la bolsa virtual de "${budget_category}"`);
                error.statusCode = 400;
                throw error;
            }

            await tx.account.update({
                where: { id: parseInt(account_id) },
                data: { balance: { decrement: amount } }
            });

            await tx.budgetBalance.update({
                where: {
                    user_id_category: { user_id: adminCtx.adminId, category: budget_category }
                },
                data: { balance: { decrement: amount } }
            });
        }

        const expense = await tx.expense.create({
            data: {
                user_id: userId,
                provider_id: parseInt(provider_id),
                account_id: parseInt(account_id),
                budget_category,
                amount,
                status: finalStatus,
                due_date: due_date ? new Date(due_date) : null,
                paid_at: finalStatus === 'Pagado' ? new Date() : null
            }
        });
        return expense;
    });
};

const payExpense = async (userId, expenseId, overrideAccountId = null) => {
    return await prisma.$transaction(async (tx) => {
        const adminCtx = await getAdminContext();

        const expense = await tx.expense.findFirst({
            where: { id: parseInt(expenseId) }
        });

        if (!expense) {
            const error = new Error('El gasto seleccionado no existe');
            error.statusCode = 404;
            throw error;
        }

        if (expense.status === 'Pagado') {
            const error = new Error('Este gasto ya ha sido pagado previamente');
            error.statusCode = 400;
            throw error;
        }

        const finalAccountId = overrideAccountId ? parseInt(overrideAccountId) : expense.account_id;
        const account = await tx.account.findFirst({
            where: { id: finalAccountId }
        });

        if (!account) {
            const error = new Error('La cuenta asociada a este gasto no existe');
            error.statusCode = 404;
            throw error;
        }

        const budget = await tx.budgetBalance.findUnique({
            where: {
                user_id_category: { user_id: adminCtx.adminId, category: expense.budget_category }
            }
        });

        if (!budget) {
            const error = new Error(`La bolsa de presupuesto "${expense.budget_category}" no existe`);
            error.statusCode = 404;
            throw error;
        }

        if (Number(account.balance) < Number(expense.amount)) {
            const error = new Error('Saldo insuficiente en la cuenta física');
            error.statusCode = 400;
            throw error;
        }

        if (Number(budget.balance) < Number(expense.amount)) {
            const error = new Error(`Saldo insuficiente en la bolsa virtual de "${expense.budget_category}"`);
            error.statusCode = 400;
            throw error;
        }

        await tx.account.update({
            where: { id: account.id },
            data: { balance: { decrement: expense.amount } }
        });

        await tx.budgetBalance.update({
            where: {
                user_id_category: { user_id: adminCtx.adminId, category: expense.budget_category }
            },
            data: { balance: { decrement: expense.amount } }
        });

        const updatedExpense = await tx.expense.update({
            where: { id: expense.id },
            data: {
                status: 'Pagado',
                paid_at: new Date(),
                account_id: finalAccountId
            }
        });

        return updatedExpense;
    })
}

const getExpenses = async (userId, filters = {}) => {
    const { status, budget_category, from_date, to_date } = filters;

    const whereConditions = {};

    if (status) {
        whereConditions.status = status;
    }

    if (budget_category) {
        whereConditions.budget_category = budget_category;
    }

    if (from_date || to_date) {
        whereConditions.created_at = {};

        if (from_date) {
            whereConditions.created_at.gte = new Date(from_date);
        }
        if (to_date) {
            whereConditions.created_at.lte = new Date(to_date);
        }
    }

    return await prisma.expense.findMany({
        where: whereConditions,
        include: {
            provider: { select: { name: true } },
            account: { select: { name: true } },
            user: { select: { username: true } }
        },
        orderBy: {
            created_at: 'desc'
        }
    });
};

const getUpcomingExpenses = async (userId, daysWindow = 7) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const futureLimit = new Date();
    futureLimit.setDate(today.getDate() + daysWindow);

    return await prisma.expense.findMany({
        where: {
            status: 'Pendiente',
            due_date: {
                gte: today,
                lte: futureLimit
            }
        },
        include: {
            provider: { select: { name: true } }
        },
        orderBy: {
            due_date: 'asc'
        }
    });
};

const deleteExpense = async (expenseId) => {
    const expense = await prisma.expense.findUnique({ where: { id: parseInt(expenseId) } });
    if (!expense) {
        const error = new Error('Gasto no encontrado');
        error.statusCode = 404;
        throw error;
    }
    if (expense.status === 'Pagado') {
        const error = new Error('No se puede eliminar un gasto que ya fue pagado');
        error.statusCode = 400;
        throw error;
    }
    return await prisma.expense.delete({ where: { id: parseInt(expenseId) } });
};

module.exports = {
    createExpense,
    payExpense,
    getExpenses,
    getUpcomingExpenses,
    deleteExpense
};