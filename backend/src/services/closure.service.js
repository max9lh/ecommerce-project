const prisma = require('../config/db');
const { getAdminContext } = require('../utils/adminContext');
const { BUDGET_CATEGORIES } = require('../utils/constants');

const createClosure = async ({ total_amount, details, user_id }) => {

    if (!total_amount || total_amount <= 0) {
        const error = new Error('El total debe ser mayor a 0');
        error.statusCode = 400;
        throw error;
    }

    if (!Array.isArray(details) || details.length === 0) {
        const error = new Error('Debe haber al menos un detalle de cierre');
        error.statusCode = 400;
        throw error;
    }

    // Validar que cada detalle sea válido
    for (const detail of details) {
        if (!detail.amount || detail.amount <= 0) {
            const error = new Error(`Monto inválido en detalle: ${detail.amount}`);
            error.statusCode = 400;
            throw error;
        }
    }

    // Validar que la suma de detalles sea consistente
    const totalDetails = details.reduce((sum, d) => sum + Number(d.amount), 0);
    if (Math.abs(totalDetails - total_amount) > 0.01) {  // Permitir pequeña variación por decimales
        const error = new Error(`La suma de detalles (${totalDetails}) no coincide con el total (${total_amount})`);
        error.statusCode = 400;
        throw error;
    }

    const adminCtx = await getAdminContext();

    const merchandise_amount = total_amount * adminCtx.pct.merchandise;
    const fixed_amount = total_amount * adminCtx.pct.fixed_expenses;
    const saving_amount = total_amount * adminCtx.pct.savings;

    const adminAccountIds = adminCtx.accounts.map(a => a.id);
    for (const d of details) {
        if (!adminAccountIds.includes(d.account_id)) {
            const error = new Error(`La cuenta con ID ${d.account_id} no pertenece al administrador o no existe`);
            error.statusCode = 400;
            throw error;
        }
    }

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

const getClosures = async (page = 1, limit = 20) => {
    const skip = (Math.max(1, page) - 1) * limit;

    const [total, closures] = await Promise.all([
        prisma.dailyClosure.count(),
        prisma.dailyClosure.findMany({
            orderBy: { date: 'desc' },
            skip,
            take: limit,
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
                            select: { id: true, name: true }
                        }
                    }
                }
            }
        })
    ]);

    return {
        data: closures,
        meta: {
            total,
            page: Math.max(1, page),
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
};

const getClosureById = async (id) => {
    return prisma.dailyClosure.findUnique({
        where: { id: parseInt(id) },
        select: {
            id: true,
            total_amount: true,
            date: true,
            user_id: true,
            details: {
                select: {
                    account_id: true,
                    amount: true,
                    account: {
                        select: { name: true }
                    }
                }
            },
            budget_allocations: {
                select: {
                    category: true,
                    amount_allocated: true
                }
            }
        }
    });
};

const updateClosure = async (id, { total_amount, details, user_id }) => {

    if (!total_amount || total_amount <= 0) {
        const error = new Error('El total debe ser mayor a 0');
        error.statusCode = 400;
        throw error;
    }

    if (!Array.isArray(details) || details.length === 0) {
        const error = new Error('Debe haber al menos un detalle de cierre');
        error.statusCode = 400;
        throw error;
    }

    for (const detail of details) {
        if (!detail.amount || detail.amount <= 0) {
            const error = new Error(`Monto inválido en detalle: ${detail.amount}`);
            error.statusCode = 400;
            throw error;
        }
    }

    const totalDetails = details.reduce((sum, d) => sum + Number(d.amount), 0);
    if (Math.abs(totalDetails - total_amount) > 0.01) {
        const error = new Error(`La suma de detalles (${totalDetails}) no coincide con el total (${total_amount})`);
        error.statusCode = 400;
        throw error;
    }

    const adminCtx = await getAdminContext();

    const merchandise_amount = total_amount * adminCtx.pct.merchandise;
    const fixed_amount = total_amount * adminCtx.pct.fixed_expenses;
    const saving_amount = total_amount * adminCtx.pct.savings;

    const adminAccountIds = adminCtx.accounts.map(a => a.id);
    for (const d of details) {
        if (!adminAccountIds.includes(d.account_id)) {
            const error = new Error(`La cuenta con ID ${d.account_id} no pertenece al administrador o no existe`);
            error.statusCode = 400;
            throw error;
        }
    }

    const result = await prisma.$transaction(async (tx) => {
        // 1. Obtener el cierre actual con sus detalles y asignaciones de presupuesto
        const oldClosure = await tx.dailyClosure.findUnique({
            where: { id: parseInt(id) },
            include: {
                details: true,
                budget_allocations: true
            }
        });

        if (!oldClosure) {
            const err = new Error('Cierre de caja no encontrado');
            err.statusCode = 404;
            throw err;
        }

        // 2. Revertir saldos de cuentas físicas anteriores
        for (const oldDetail of oldClosure.details) {
            await tx.account.update({
                where: { id: oldDetail.account_id },
                data: { balance: { decrement: oldDetail.amount } }
            });
        }

        // 3. Revertir saldos de bolsas virtuales anteriores
        for (const oldAlloc of oldClosure.budget_allocations) {
            await tx.budgetBalance.update({
                where: {
                    user_id_category: {
                        user_id: adminCtx.adminId,
                        category: oldAlloc.category
                    }
                },
                data: { balance: { decrement: oldAlloc.amount_allocated } }
            });
        }

        // 4. Actualizar el Cierre de Caja
        const updatedClosure = await tx.dailyClosure.update({
            where: { id: parseInt(id) },
            data: {
                total_amount
            }
        });

        // 5. Eliminar detalles y asignaciones viejas
        await tx.dailyClosureDetail.deleteMany({ where: { closure_id: oldClosure.id } });
        await tx.budgetAllocation.deleteMany({ where: { closure_id: oldClosure.id } });

        // 6. Crear nuevos detalles
        await tx.dailyClosureDetail.createMany({
            data: details.map(d => ({
                closure_id: oldClosure.id,
                account_id: d.account_id,
                amount: d.amount,
            })),
        });

        // 7. Aplicar nuevos saldos en cuentas reales
        for (const detail of details) {
            await tx.account.update({
                where: { id: detail.account_id },
                data: { balance: { increment: detail.amount } }
            });
        }

        // 8. Crear nuevas asignaciones
        await tx.budgetAllocation.createMany({
            data: [
                { closure_id: oldClosure.id, user_id: adminCtx.adminId, amount_allocated: merchandise_amount, category: BUDGET_CATEGORIES.MERCHANDISE },
                { closure_id: oldClosure.id, user_id: adminCtx.adminId, amount_allocated: fixed_amount, category: BUDGET_CATEGORIES.FIXED_EXPENSES },
                { closure_id: oldClosure.id, user_id: adminCtx.adminId, amount_allocated: saving_amount, category: BUDGET_CATEGORIES.SAVINGS },
            ],
        });

        // 9. Aplicar nuevos saldos en bolsas virtuales
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

        // 10. Registrar log de auditoría
        await tx.auditLog.create({
            data: {
                user_id: user_id,
                action: 'REGISTRAR_CIERRE',
                details: `Editó el cierre de caja #${id} con un nuevo total de $${parseFloat(total_amount).toFixed(2)} (antes $${parseFloat(oldClosure.total_amount).toFixed(2)})`
            }
        });

        return updatedClosure;
    });

    return result;
};

module.exports = { createClosure, getClosures, getClosureById, updateClosure };