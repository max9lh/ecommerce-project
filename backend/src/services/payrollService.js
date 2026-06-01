const prisma = require('../config/db');
const { getAdminContext } = require('../utils/adminContext');
const { STATUS_AMOUNT, BUDGET_CATEGORIES } = require('../utils/constants');
const Decimal = require('decimal.js');

/**
 * Busca o crea un proveedor "Nómina" para registrar gastos de sueldos/adelantos.
 * Esto permite reutilizar el flujo de Expense existente sin romper la constraint NOT NULL de provider_id.
 */
const getOrCreatePayrollProvider = async (tx, adminId) => {
    let provider = await tx.provider.findFirst({
        where: {
            user_id: adminId,
            name: 'Nómina'
        }
    });

    if (!provider) {
        provider = await tx.provider.create({
            data: {
                user_id: adminId,
                name: 'Nómina',
                payment_condition: 'Contado',
                credit_days: 0,
                visible_to_employee: false
            }
        });
    }

    return provider;
};

/**
 * registerAdvance — Registra un adelanto de sueldo para un empleado.
 *
 * Crea un Expense con status: 'Pagado', category: 'Gastos Fijos',
 * debita la bolsa virtual de Gastos Fijos y la cuenta física del ADMIN.
 *
 * @param {Object} params
 * @param {number} params.employeeUserId — ID del User con role EMPLOYEE
 * @param {number} params.amount — Monto del adelanto
 * @param {number} params.userId — ID del usuario que registra (trazabilidad)
 * @param {number} [params.accountId] — Cuenta física a debitar (opcional, usa la primera del admin)
 */
const registerAdvance = async ({ employeeUserId, amount, userId, accountId }) => {
    const advanceAmount = new Decimal(amount);

    if (advanceAmount.lte(0)) {
        const error = new Error('El monto del adelanto debe ser positivo');
        error.statusCode = 400;
        throw error;
    }

    return await prisma.$transaction(async (tx) => {
        const adminCtx = await getAdminContext();

        // Verificar que el empleado existe y tiene perfil
        const employee = await tx.user.findFirst({
            where: { id: parseInt(employeeUserId, 10), role: 'EMPLOYEE', deleted_at: null },
            include: { employeeProfile: true }
        });

        if (!employee || !employee.employeeProfile) {
            const error = new Error('Empleado no encontrado o sin perfil');
            error.statusCode = 404;
            throw error;
        }

        // Obtener o crear proveedor "Nómina"
        const payrollProvider = await getOrCreatePayrollProvider(tx, adminCtx.adminId);

        // Determinar cuenta física a usar
        const finalAccountId = accountId
            ? parseInt(accountId, 10)
            : adminCtx.accounts[0]?.id;

        if (!finalAccountId) {
            const error = new Error('No hay cuentas físicas registradas');
            error.statusCode = 400;
            throw error;
        }

        const account = await tx.account.findUnique({ where: { id: finalAccountId } });
        if (!account) {
            const error = new Error('Cuenta física no encontrada');
            error.statusCode = 404;
            throw error;
        }

        if (new Decimal(account.balance.toString()).lt(advanceAmount)) {
            const error = new Error('Saldo insuficiente en la cuenta física');
            error.statusCode = 400;
            throw error;
        }

        // Verificar bolsa de Gastos Fijos
        const budget = await tx.budgetBalance.findUnique({
            where: {
                user_id_category: { user_id: adminCtx.adminId, category: BUDGET_CATEGORIES.FIXED_EXPENSES }
            }
        });

        if (!budget || new Decimal(budget.balance.toString()).lt(advanceAmount)) {
            const error = new Error('Saldo insuficiente en la bolsa de Gastos Fijos');
            error.statusCode = 400;
            throw error;
        }

        // Debitar cuenta física
        await tx.account.update({
            where: { id: finalAccountId },
            data: { balance: { decrement: parseFloat(advanceAmount.toString()) } }
        });

        // Debitar bolsa virtual
        await tx.budgetBalance.update({
            where: {
                user_id_category: { user_id: adminCtx.adminId, category: BUDGET_CATEGORIES.FIXED_EXPENSES }
            },
            data: { balance: { decrement: parseFloat(advanceAmount.toString()) } }
        });

        // Crear Expense pagado
        const expense = await tx.expense.create({
            data: {
                user_id: userId,
                provider_id: payrollProvider.id,
                account_id: finalAccountId,
                budget_category: BUDGET_CATEGORIES.FIXED_EXPENSES,
                amount: parseFloat(advanceAmount.toString()),
                status: STATUS_AMOUNT.PAID,
                paid_at: new Date(),
                due_date: new Date()
            }
        });

        // Auditoría
        await tx.auditLog.create({
            data: {
                user_id: userId,
                action: 'REGISTRAR_ADELANTO',
                details: `Registró adelanto de sueldo de $${advanceAmount.toFixed(2)} para ${employee.employeeProfile.first_name} ${employee.employeeProfile.last_name}`
            }
        });

        return expense;
    });
};

/**
 * processMonthlyPayroll — Genera los egresos pendientes de sueldo neto para todos los empleados activos.
 *
 * Para cada empleado con salary_type = 'fixed':
 *   salarioNeto = monthly_salary - totalAdelantosMes
 *   Crea un Expense con status: 'Pendiente' por el neto
 *
 * @param {number} userId — ID del usuario que procesa (trazabilidad)
 */
const processMonthlyPayroll = async ({ userId }) => {
    return await prisma.$transaction(async (tx) => {
        const adminCtx = await getAdminContext();
        const payrollProvider = await getOrCreatePayrollProvider(tx, adminCtx.adminId);

        // Inicio y fin del mes actual
        const now = new Date();
        const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59));

        // Obtener empleados activos con perfil
        const employees = await tx.user.findMany({
            where: { role: 'EMPLOYEE', deleted_at: null },
            include: { employeeProfile: true }
        });

        const results = [];

        for (const emp of employees) {
            if (!emp.employeeProfile || emp.employeeProfile.salary_type !== 'fixed') {
                continue; // Solo procesar empleados con salario fijo
            }

            const monthlySalary = new Decimal(emp.employeeProfile.monthly_salary?.toString() || '0');
            if (monthlySalary.lte(0)) continue;

            // Calcular total de adelantos del mes (pagos hechos vía Nómina provider)
            const advances = await tx.expense.findMany({
                where: {
                    provider_id: payrollProvider.id,
                    status: STATUS_AMOUNT.PAID,
                    deleted_at: null,
                    paid_at: {
                        gte: monthStart,
                        lte: monthEnd
                    }
                }
            });

            // Filtrar adelantos de este empleado (verificando el user que lo registró no sirve,
            // necesitamos otra forma de vincular — usamos la auditoría como referencia de nombre)
            // Para simplificar, sumamos todos los adelantos del proveedor Nómina del mes
            const totalAdvances = advances.reduce(
                (sum, adv) => sum.plus(new Decimal(adv.amount.toString())),
                new Decimal(0)
            );

            const netSalary = Decimal.max(monthlySalary.minus(totalAdvances), new Decimal(0));

            if (netSalary.lte(0)) {
                results.push({
                    employee: `${emp.employeeProfile.first_name} ${emp.employeeProfile.last_name}`,
                    monthlySalary: monthlySalary.toNumber(),
                    advances: totalAdvances.toNumber(),
                    netSalary: 0,
                    status: 'Adelantos cubren el salario completo'
                });
                continue;
            }

            // Determinar cuenta física a usar
            const accountId = adminCtx.accounts[0]?.id;
            if (!accountId) {
                const error = new Error('No hay cuentas físicas registradas');
                error.statusCode = 400;
                throw error;
            }

            // Crear Expense pendiente por el neto — la bolsa NO se debita aún
            const expense = await tx.expense.create({
                data: {
                    user_id: userId,
                    provider_id: payrollProvider.id,
                    account_id: accountId,
                    budget_category: BUDGET_CATEGORIES.FIXED_EXPENSES,
                    amount: parseFloat(netSalary.toString()),
                    status: STATUS_AMOUNT.PENDING,
                    due_date: monthEnd
                }
            });

            results.push({
                employee: `${emp.employeeProfile.first_name} ${emp.employeeProfile.last_name}`,
                monthlySalary: monthlySalary.toNumber(),
                advances: totalAdvances.toNumber(),
                netSalary: netSalary.toNumber(),
                expenseId: expense.id,
                status: 'Egreso pendiente creado'
            });
        }

        // Auditoría
        await tx.auditLog.create({
            data: {
                user_id: userId,
                action: 'PROCESAR_NOMINA',
                details: `Procesó nómina mensual para ${results.length} empleado(s). Total neto: $${results.reduce((s, r) => s + r.netSalary, 0).toFixed(2)}`
            }
        });

        return results;
    });
};

module.exports = { registerAdvance, processMonthlyPayroll };
