const prisma = require('../config/db');

const createClosure = async ({ total_amount, details, user_id }) => {
    const user = await prisma.user.findUnique({
        where: { id:user_id },
        select: { pct_merchandise: true, pct_fixed_expenses: true, pct_savings: true },
    });
    if(!user){
        const error = new Error('Porcentajes vacios');
        error.statusCode = 409;
        throw error;
    }

    const marchandise_amount = total_amount * user.pct_merchandise;
    const fixed_amount = total_amount * user.pct_fixed_expenses;
    const saving_amount = total_amount * user.pct_savings;

    const result = await prisma.$transaction(async (tx) => {
        const closure = await tx.dailyClosure.create({ data: { user_id: user_id, total_amount } });

        await tx.dailyClosureDetail.createMany({
            data: details.map(d => ({
                closure_id: closure.id,
                account_id: d.account_id,
                amount: d.amount,
            })),
        });

        await tx.budgetAllocation.createMany({
            data: [
                { closure_id: closure.id, user_id: user_id, amount_allocated: marchandise_amount, category: 'Mercaderia' },
                { closure_id: closure.id, user_id: user_id, amount_allocated: fixed_amount,       category: 'Gastos fijos' },
                { closure_id: closure.id, user_id: user_id, amount_allocated: saving_amount,      category: 'Ahorro' },
            ],
        });

        return closure;
    });
    return result;
};

module.exports = { createClosure };
