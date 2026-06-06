const prisma = require('../config/db');
const { getAdminContext } = require('../utils/adminContext');

/**
 * Crea un nuevo gasto recurrente vinculado al ADMIN.
 */
const createRecurringExpense = async (userId, data) => {
    const { name, amount, due_day, category, frequency } = data;
    const freq = frequency || 'monthly';

    // Validaciones de negocio
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

    if (freq === 'weekly') {
        if (due_day < 0 || due_day > 6) {
            const error = new Error('Para gastos semanales, el día de vencimiento debe estar entre 0 (Domingo) y 6 (Sábado)');
            error.statusCode = 400;
            throw error;
        }
    } else {
        if (due_day < 1 || due_day > 31) {
            const error = new Error('Para gastos mensuales, el día de vencimiento debe estar entre 1 y 31');
            error.statusCode = 400;
            throw error;
        }
    }

    return await prisma.$transaction(async (tx) => {
        const adminCtx = await getAdminContext();

        // 1. Crear el gasto recurrente mensual/semanal
        const recurring = await tx.recurringExpense.create({
            data: {
                user_id: adminCtx.adminId,
                name,
                amount: parseFloat(amount),
                frequency: freq,
                due_day: parseInt(due_day, 10),
                category: category || 'Gastos Fijos'
            }
        });

        // 2. Obtener o crear proveedor del gasto recurrente para el Expense
        let provider = await tx.provider.findFirst({
            where: { user_id: adminCtx.adminId, name: name }
        });
        if (!provider) {
            provider = await tx.provider.create({
                data: {
                    user_id: adminCtx.adminId,
                    name: name,
                    payment_condition: 'Credito',
                    credit_days: 30,
                    visible_to_employee: true
                }
            });
        }

        // 3. Obtener la primera cuenta física del ADMIN
        const account = adminCtx.accounts[0];
        if (!account) {
            const error = new Error('No hay cuentas físicas registradas para el administrador.');
            error.statusCode = 400;
            throw error;
        }

        // 4. Generar egresos pendientes correspondientes para el mes actual
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        if (freq === 'weekly') {
            const todayDate = now.getDate();
            const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
            const datesToCreate = [];

            // Buscar todos los días de la semana correspondientes en el mes actual a partir de hoy
            for (let d = todayDate; d <= lastDay; d++) {
                const dateCheck = new Date(Date.UTC(currentYear, currentMonth, d));
                if (dateCheck.getUTCDay() === parseInt(due_day, 10)) {
                    datesToCreate.push(new Date(Date.UTC(currentYear, currentMonth, d, 12, 0, 0)));
                }
            }

            for (const dDate of datesToCreate) {
                await tx.expense.create({
                    data: {
                        user_id: userId,
                        provider_id: provider.id,
                        account_id: account.id,
                        budget_category: category || 'Gastos Fijos',
                        amount: parseFloat(amount),
                        status: 'Pendiente',
                        due_date: dDate
                    }
                });
            }
        } else {
            // Mensual
            const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
            const finalDueDay = Math.min(parseInt(due_day, 10), lastDay);
            const dueDate = new Date(Date.UTC(currentYear, currentMonth, finalDueDay, 12, 0, 0));

            await tx.expense.create({
                data: {
                    user_id: userId,
                    provider_id: provider.id,
                    account_id: account.id,
                    budget_category: category || 'Gastos Fijos',
                    amount: parseFloat(amount),
                    status: 'Pendiente',
                    due_date: dueDate
                }
            });
        }

        // 5. Registrar en auditoría
        await tx.auditLog.create({
            data: {
                user_id: userId,
                action: 'CREAR_GASTO_RECURRENTE',
                details: `Creó gasto recurrente ${freq === 'weekly' ? 'semanal' : 'mensual'} "${name}" por $${parseFloat(amount).toFixed(2)} y generó sus egresos pendientes del mes actual`
            }
        });

        return recurring;
    });
};

/**
 * Lista todos los gastos recurrentes del ADMIN.
 */
const getRecurringExpenses = async () => {
    const adminCtx = await getAdminContext();

    return prisma.recurringExpense.findMany({
        where: { user_id: adminCtx.adminId },
        orderBy: [{ frequency: 'asc' }, { due_day: 'asc' }]
    });
};

/**
 * Actualiza un gasto recurrente existente.
 */
const updateRecurringExpense = async (userId, expenseId, data) => {
    const id = parseInt(expenseId, 10);
    const existing = await prisma.recurringExpense.findUnique({ where: { id } });

    if (!existing) {
        const error = new Error('Gasto recurrente no encontrado');
        error.statusCode = 404;
        throw error;
    }

    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.amount !== undefined) updateData.amount = parseFloat(data.amount);

    const freq = data.frequency !== undefined ? data.frequency : existing.frequency;
    if (data.frequency !== undefined) updateData.frequency = data.frequency;

    if (data.due_day !== undefined) {
        if (freq === 'weekly') {
            if (data.due_day < 0 || data.due_day > 6) {
                const error = new Error('Para gastos semanales, el día de vencimiento debe estar entre 0 (Domingo) y 6 (Sábado)');
                error.statusCode = 400;
                throw error;
            }
        } else {
            if (data.due_day < 1 || data.due_day > 31) {
                const error = new Error('Para gastos mensuales, el día de vencimiento debe estar entre 1 y 31');
                error.statusCode = 400;
                throw error;
            }
        }
        updateData.due_day = parseInt(data.due_day, 10);
    }
    if (data.category !== undefined) updateData.category = data.category;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;

    const updated = await prisma.recurringExpense.update({
        where: { id },
        data: updateData
    });

    await prisma.auditLog.create({
        data: {
            user_id: userId,
            action: 'EDITAR_GASTO_RECURRENTE',
            details: `Editó gasto recurrente "${updated.name}" (ID ${id})`
        }
    });

    return updated;
};

/**
 * Desactiva (soft delete) un gasto recurrente.
 */
const deleteRecurringExpense = async (userId, expenseId) => {
    const id = parseInt(expenseId, 10);
    const existing = await prisma.recurringExpense.findUnique({ where: { id } });

    if (!existing) {
        const error = new Error('Gasto recurrente no encontrado');
        error.statusCode = 404;
        throw error;
    }

    const deleted = await prisma.recurringExpense.delete({
        where: { id }
    });

    await prisma.auditLog.create({
        data: {
            user_id: userId,
            action: 'ELIMINAR_GASTO_RECURRENTE',
            details: `Eliminó físicamente el gasto recurrente "${existing.name}" (ID ${id})`
        }
    });

    return deleted;
};

module.exports = {
    createRecurringExpense,
    getRecurringExpenses,
    updateRecurringExpense,
    deleteRecurringExpense
};
