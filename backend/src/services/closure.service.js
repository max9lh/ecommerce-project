const prisma = require('../config/db');
const { getAdminContext } = require('../utils/adminContext');
const { BUDGET_CATEGORIES } = require('../utils/constants');

const createClosure = async ({ total_amount, details, user_id }) => {
    const adminCtx = await getAdminContext();

    const merchandise_amount = total_amount * adminCtx.pct.merchandise;
    const fixed_amount = total_amount * adminCtx.pct.fixed_expenses;
    const saving_amount = total_amount * adminCtx.pct.savings;

    const result = await prisma.$transaction(async (tx) => {
        const closure = await tx.dailyClosure.create({
            data: {
                user_id: user_id,
                total_amount
            }
        });

        await tx.dailyClosureDetail.createMany({
            data: details.map(d => ({
                closure_id: closure.id,
                account_id: d.account_id,
                amount: d.amount,
            })),
        });

        // Actualización de saldos en cuentas reales del local (bajo el Admin)
        for (const detail of details) {
            await tx.account.update({
                where: { id: detail.account_id },
                data: { balance: { increment: detail.amount } }
            });
        }

        await tx.budgetAllocation.createMany({
            data: [
                { closure_id: closure.id, user_id: adminCtx.adminId, amount_allocated: merchandise_amount, category: BUDGET_CATEGORIES.MERCHANDISE },
                { closure_id: closure.id, user_id: adminCtx.adminId, amount_allocated: fixed_amount, category: BUDGET_CATEGORIES.FIXED_EXPENSES },
                { closure_id: closure.id, user_id: adminCtx.adminId, amount_allocated: saving_amount, category: BUDGET_CATEGORIES.SAVINGS },
            ],
        });

        const categories = [
            { name: BUDGET_CATEGORIES.MERCHANDISE, amount: merchandise_amount },
            { name: BUDGET_CATEGORIES.FIXED_EXPENSES, amount: fixed_amount },
            { name: BUDGET_CATEGORIES.SAVINGS, amount: saving_amount }
        ];

        for (const cat of categories) {
            await tx.budgetBalance.upsert({
                where: {
                    user_id_category: { user_id: adminCtx.adminId, category: cat.name }
                },
                update: {
                    balance: { increment: cat.amount }
                },
                create: {
                    user_id: adminCtx.adminId,
                    category: cat.name,
                    balance: cat.amount
                }
            });
        }

        await tx.auditLog.create({
            data: {
                user_id: user_id,
                action: 'REGISTRAR_CIERRE',
                details: `Registró un cierre de caja por un total de $${parseFloat(total_amount).toFixed(2)}`
            }
        });

        return closure;
    });
    return result;
};

const getClosures = async () => {
    return prisma.dailyClosure.findMany({
        orderBy: { date: 'desc' },
        select: {
            id: true,
            total_amount: true,
            date: true,
            user: {
                select: { username: true }
            },
            details: {
                select: {
                    amount: true,
                    account: {
                        select: { name: true }
                    }
                }
            }
        }
    });
};

module.exports = { createClosure, getClosures };