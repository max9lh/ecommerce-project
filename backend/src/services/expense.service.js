const prisma = require('../config/db');
const { getAdminContext, clearAdminContextCache } = require('../utils/adminContext');
const { STATUS_AMOUNT } = require('../utils/constants');
const { Decimal } = require('decimal.js');

const createExpense = async (userId, expenseData) => {
    const { provider_id, account_id, budget_category, amount, status, due_date } = expenseData;

    if (!amount || amount <= 0) {
        const error = new Error('El monto debe ser mayor a 0');
        error.statusCode = 400;
        throw error;
    }

    if (!Number.isFinite(amount)) {
        const error = new Error('El monto debe ser un número válido');
        error.statusCode = 400;
        throw error;
    }

    return await prisma.$transaction(async (tx) => {
        const adminCtx = await getAdminContext();

        const provider = await tx.provider.findUnique({
            where: { id: parseInt(provider_id, 10) }
        });
        if (!provider) {
            const error = new Error('El proveedor seleccionado no existe');
            error.statusCode = 404;
            throw error;
        }

        const finalStatus = status || STATUS_AMOUNT.PENDING;

        if (finalStatus === STATUS_AMOUNT.PENDING && provider.payment_condition === 'Contado') {
            const error = new Error('Este proveedor no acepta crédito. El egreso debe registrarse como Pagado.');
            error.statusCode = 400;
            throw error;
        }

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

        if (finalStatus === STATUS_AMOUNT.PAID) {
            const account = await tx.account.findUnique({
                where: { id: parseInt(account_id, 10) }
            });

            if (!account) {
                const error = new Error('La cuenta física seleccionada no existe');
                error.statusCode = 404;
                throw error;
            }

            const accountBalance = new Decimal(account.balance);
            const expenseAmount = new Decimal(amount);

            if (accountBalance.lt(expenseAmount)) {
                const error = new Error('Saldo insuficiente en la cuenta física seleccionada');
                error.statusCode = 400;
                throw error;
            }

            await tx.account.update({
                where: { id: parseInt(account_id, 10) },
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
                provider_id: parseInt(provider_id, 10),
                account_id: parseInt(account_id, 10),
                budget_category,
                amount,
                status: finalStatus,
                due_date: due_date ? new Date(due_date) : null,
                paid_at: finalStatus === STATUS_AMOUNT.PAID ? new Date() : null
            }
        });

        await tx.auditLog.create({
            data: {
                user_id: userId,
                action: 'REGISTRAR_EGRESO',
                details: `Registró un egreso de tipo "${budget_category}" por un monto de $${parseFloat(amount).toFixed(2)} (Estado: ${finalStatus})`
            }
        });

        return expense;
    });
    clearAdminContextCache();
};

const payExpense = async (userId, expenseId, overrideAccountId = null) => {
    return await prisma.$transaction(async (tx) => {
        const adminCtx = await getAdminContext();

        const expense = await tx.expense.findFirst({
            where: { id: parseInt(expenseId, 10), deleted_at: null }
        });

        if (!expense) {
            const error = new Error('El gasto seleccionado no existe');
            error.statusCode = 404;
            throw error;
        }

        if (expense.status === STATUS_AMOUNT.PAID) {
            const error = new Error('Este gasto ya ha sido pagado previamente');
            error.statusCode = 400;
            throw error;
        }

        const finalAccountId = overrideAccountId ? parseInt(overrideAccountId, 10) : expense.account_id;
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
                status: STATUS_AMOUNT.PAID,
                paid_at: new Date(),
                account_id: finalAccountId
            }
        });

        await tx.auditLog.create({
            data: {
                user_id: userId,
                action: 'PAGAR_EGRESO',
                details: `Pagó el egreso ID ${expenseId} (Concepto: "${expense.budget_category}") por un monto de $${parseFloat(expense.amount).toFixed(2)}`
            }
        });

        return updatedExpense;
    });
    clearAdminContextCache();
};

const getExpenses = async (userId, filters = {}) => {
    const { status, budget_category, from_date, to_date, page, limit } = filters;
    const whereConditions = { deleted_at: null };

    if (status) {
        whereConditions.status = status;
    }

    if (budget_category) {
        whereConditions.budget_category = budget_category;
    }

    if (from_date || to_date) {
        whereConditions.created_at = {};
        if (from_date) whereConditions.created_at.gte = new Date(from_date);
        if (to_date) whereConditions.created_at.lte = new Date(to_date);
    }

    if (!page && !limit) {
        const MAX_EXPORT = 5000;
        const expenses = await prisma.expense.findMany({
            where: whereConditions,
            take: MAX_EXPORT,
            include: {
                provider: { select: { name: true } },
                account: { select: { name: true } },
                user: { select: { username: true } }
            },
            orderBy: {
                created_at: 'desc'
            }
        });
        return { success: true, data: expenses, truncated: expenses.length === MAX_EXPORT };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const [total, expenses] = await Promise.all([
        prisma.expense.count({ where: whereConditions }),
        prisma.expense.findMany({
            where: whereConditions,
            skip,
            take: limitNum,
            include: {
                provider: { select: { name: true } },
                account: { select: { name: true } },
                user: { select: { username: true } }
            },
            orderBy: {
                created_at: 'desc'
            }
        })
    ]);

    return {
        success: true,
        data: expenses,
        meta: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum)
        }
    };
};

const getUpcomingExpenses = async (userId, daysWindow = 7) => {
    const adminCtx = await getAdminContext();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const futureLimit = new Date();
    futureLimit.setDate(today.getDate() + daysWindow);

    return await prisma.expense.findMany({
        where: {
            status: STATUS_AMOUNT.PENDING,
            deleted_at: null,
            due_date: { lte: futureLimit }
        },
        include: { provider: { select: { name: true } } },
        orderBy: { due_date: 'asc' }
    });
};

const deleteExpense = async (userId, expenseId) => {
    const idParsed = parseInt(expenseId, 10);
    const expense = await prisma.expense.findFirst({
        where: { id: idParsed, deleted_at: null }
    });
    if (!expense) {
        const error = new Error('Gasto no encontrado');
        error.statusCode = 404;
        throw error;
    }
    if (expense.status === STATUS_AMOUNT.PAID) {
        const error = new Error('Los gastos pagados no pueden eliminarse por razones de consistencia de caja. Si fue un error, registre un movimiento de ajuste.');
        error.statusCode = 400;
        throw error;
    }
    return await prisma.$transaction(async (tx) => {
        const softDeleted = await tx.expense.update({
            where: { id: idParsed },
            data: { deleted_at: new Date() }
        });

        await tx.auditLog.create({
            data: {
                user_id: parseInt(userId, 10),
                action: 'ELIMINAR_EGRESO',
                details: `Eliminó el egreso pendiente ID ${expenseId} (Concepto: "${expense.budget_category}") por un monto de $${parseFloat(expense.amount).toFixed(2)}`
            }
        });
        return softDeleted;
    });
};

module.exports = {
    createExpense,
    payExpense,
    getExpenses,
    getUpcomingExpenses,
    deleteExpense
};