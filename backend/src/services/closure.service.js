const prisma = require('../config/db');
const { getAdminContext } = require('../utils/adminContext');

const createClosure = async ({ total_amount, details, user_id }) => {

    const adminCtx = await getAdminContext();

    const marchandise_amount = total_amount * adminCtx.pct.merchandise;
    const fixed_amount = total_amount * adminCtx.pct.fixed_expenses;
    const saving_amount = total_amount * adminCtx.pct.savings;

    const result = await prisma.$transaction(async (tx) => {
        const closure = await tx.dailyClosure.create({ data: { user_id: user_id, total_amount } });

        await tx.dailyClosureDetail.createMany({
            data: details.map(d => ({
                closure_id: closure.id,
                account_id: d.account_id,
                amount: d.amount,
            })),
        });

        for (const detail of details) {
            await tx.account.update({
                where: { id: detail.account_id },
                data: { balance: { increment: detail.amount } }
            });
        }

        await tx.budgetAllocation.createMany({
            data: [
                { closure_id: closure.id, user_id: adminCtx.adminId, amount_allocated: marchandise_amount, category: 'Mercadería' },
                { closure_id: closure.id, user_id: adminCtx.adminId, amount_allocated: fixed_amount, category: 'Gastos Fijos' },
                { closure_id: closure.id, user_id: adminCtx.adminId, amount_allocated: saving_amount, category: 'Ahorro' },
            ],
        });

        const categories = [
            { name: 'Mercadería', amount: marchandise_amount },
            { name: 'Gastos Fijos', amount: fixed_amount },
            { name: 'Ahorro', amount: saving_amount }
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
