const prisma = require('../config/db');
const { getAdminContext } = require('../utils/adminContext');
const { STATUS_AMOUNT, BUDGET_CATEGORIES } = require('../utils/constants');

/**
 * getPeriodSummary — KPIs financieros del período
 * Retorna: ingresos totales, egresos pagados, utilidad neta, margen %, costo nómina,
 *          cantidad de cierres y egresos, y comparativa vs período anterior.
 */
const getPeriodSummary = async (from, to) => {
    const dateFrom = new Date(from);
    const dateTo = new Date(to);

    // Período anterior (misma duración, desplazado hacia atrás)
    const diffMs = dateTo - dateFrom;
    const prevFrom = new Date(dateFrom.getTime() - diffMs);
    const prevTo = new Date(dateFrom);

    // Ejecutar consultas en paralelo
    const [incomeAgg, expenseAgg, payrollAgg, prevIncomeAgg, prevExpenseAgg] = await Promise.all([
        prisma.dailyClosure.aggregate({
            where: { date: { gte: dateFrom, lte: dateTo } },
            _sum: { total_amount: true },
            _count: { id: true }
        }),
        prisma.expense.aggregate({
            where: {
                status: STATUS_AMOUNT.PAID,
                paid_at: { gte: dateFrom, lte: dateTo },
                deleted_at: null
            },
            _sum: { amount: true },
            _count: { id: true }
        }),
        prisma.attendanceLog.aggregate({
            where: { check_in: { gte: dateFrom, lte: dateTo } },
            _sum: { amount_earned: true, hours_worked: true }
        }),
        prisma.dailyClosure.aggregate({
            where: { date: { gte: prevFrom, lte: prevTo } },
            _sum: { total_amount: true }
        }),
        prisma.expense.aggregate({
            where: {
                status: STATUS_AMOUNT.PAID,
                paid_at: { gte: prevFrom, lte: prevTo },
                deleted_at: null
            },
            _sum: { amount: true }
        })
    ]);

    const totalIncome = Number(incomeAgg._sum.total_amount || 0);
    const totalExpenses = Number(expenseAgg._sum.amount || 0);
    const totalPayroll = Number(payrollAgg._sum.amount_earned || 0);
    const netProfit = totalIncome - totalExpenses;
    const margin = totalIncome > 0 ? ((netProfit / totalIncome) * 100) : 0;

    const prevIncome = Number(prevIncomeAgg._sum.total_amount || 0);
    const prevExpenses = Number(prevExpenseAgg._sum.amount || 0);
    const prevNetProfit = prevIncome - prevExpenses;

    // Calcular cambios porcentuales vs período anterior
    const calcChange = (current, previous) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / Math.abs(previous)) * 100;
    };

    return {
        totalIncome,
        totalExpenses,
        netProfit,
        margin: parseFloat(margin.toFixed(1)),
        totalPayroll,
        totalHours: Number(payrollAgg._sum.hours_worked || 0),
        closureCount: incomeAgg._count.id,
        expenseCount: expenseAgg._count.id,
        changes: {
            income: parseFloat(calcChange(totalIncome, prevIncome).toFixed(1)),
            expenses: parseFloat(calcChange(totalExpenses, prevExpenses).toFixed(1)),
            netProfit: parseFloat(calcChange(netProfit, prevNetProfit).toFixed(1)),
        }
    };
};

/**
 * getCashFlow — Flujo de caja agrupado por mes
 * Similar a dashboard.getIncomeVsExpenses pero incluye resultado neto
 */
const getCashFlow = async (from, to) => {
    const dateFrom = new Date(from);
    const dateTo = new Date(to);

    const diffTime = Math.abs(dateTo - dateFrom);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Si la consulta es de 31 días o menos, agrupamos por DÍA. Si no, por MES.
    const groupByDay = diffDays <= 31;

    let incomeRaw;
    let expenseRaw;

    if (groupByDay) {
        incomeRaw = await prisma.$queryRaw`
            SELECT
                DATE_TRUNC('day', date) AS period,
                COALESCE(SUM(total_amount), 0) AS total
            FROM "DailyClosure"
            WHERE date >= ${dateFrom} AND date <= ${dateTo}
            GROUP BY DATE_TRUNC('day', date)
            ORDER BY period ASC
        `;

        expenseRaw = await prisma.$queryRaw`
            SELECT
                DATE_TRUNC('day', paid_at) AS period,
                COALESCE(SUM(amount), 0) AS total
            FROM "Expense"
            WHERE status = 'Pagado'
              AND paid_at >= ${dateFrom} AND paid_at <= ${dateTo}
              AND deleted_at IS NULL
            GROUP BY DATE_TRUNC('day', paid_at)
            ORDER BY period ASC
        `;
    } else {
        incomeRaw = await prisma.$queryRaw`
            SELECT
                DATE_TRUNC('month', date) AS period,
                COALESCE(SUM(total_amount), 0) AS total
            FROM "DailyClosure"
            WHERE date >= ${dateFrom} AND date <= ${dateTo}
            GROUP BY DATE_TRUNC('month', date)
            ORDER BY period ASC
        `;

        expenseRaw = await prisma.$queryRaw`
            SELECT
                DATE_TRUNC('month', paid_at) AS period,
                COALESCE(SUM(amount), 0) AS total
            FROM "Expense"
            WHERE status = 'Pagado'
              AND paid_at >= ${dateFrom} AND paid_at <= ${dateTo}
              AND deleted_at IS NULL
            GROUP BY DATE_TRUNC('month', paid_at)
            ORDER BY period ASC
        `;
    }

    const itemMap = new Map();

    const formatKey = (date) => {
        const d = new Date(date);
        if (groupByDay) {
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        } else {
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
        }
    };

    incomeRaw.forEach((row) => {
        const key = formatKey(row.period);
        itemMap.set(key, { date: key, ingresos: Number(row.total), egresos: 0, neto: 0 });
    });

    expenseRaw.forEach((row) => {
        const key = formatKey(row.period);
        const existing = itemMap.get(key);
        if (existing) {
            existing.egresos = Number(row.total);
        } else {
            itemMap.set(key, { date: key, ingresos: 0, egresos: Number(row.total), neto: 0 });
        }
    });

    const result = Array.from(itemMap.values());
    result.sort((a, b) => a.date.localeCompare(b.date));
    result.forEach(r => { r.neto = r.ingresos - r.egresos; });

    return result;
};

/**
 * getExpensesByCategory — Egresos pagados agrupados por budget_category
 */
const getExpensesByCategory = async (from, to) => {
    const dateFrom = new Date(from);
    const dateTo = new Date(to);

    const groups = await prisma.expense.groupBy({
        by: ['budget_category'],
        where: {
            status: STATUS_AMOUNT.PAID,
            paid_at: { gte: dateFrom, lte: dateTo },
            deleted_at: null
        },
        _sum: { amount: true },
        _count: { id: true }
    });

    const total = groups.reduce((sum, g) => sum + Number(g._sum.amount || 0), 0);

    return groups.map(g => ({
        category: g.budget_category,
        amount: Number(g._sum.amount || 0),
        count: g._count.id,
        percentage: total > 0 ? parseFloat(((Number(g._sum.amount || 0) / total) * 100).toFixed(1)) : 0
    })).sort((a, b) => b.amount - a.amount);
};

/**
 * getExpensesByProvider — Top N proveedores por monto de egresos pagados
 */
const getExpensesByProvider = async (from, to, limit = 10) => {
    const dateFrom = new Date(from);
    const dateTo = new Date(to);

    const groups = await prisma.expense.groupBy({
        by: ['provider_id'],
        where: {
            status: STATUS_AMOUNT.PAID,
            paid_at: { gte: dateFrom, lte: dateTo },
            deleted_at: null
        },
        _sum: { amount: true },
        _count: { id: true },
        orderBy: { _sum: { amount: 'desc' } },
        take: limit
    });

    const total = groups.reduce((sum, g) => sum + Number(g._sum.amount || 0), 0);

    // Enriquecer con nombre del proveedor en lote
    const providerIds = groups.map(g => g.provider_id);
    const providers = await prisma.provider.findMany({
        where: { id: { in: providerIds } },
        select: { id: true, name: true }
    });
    const providerMap = new Map(providers.map(p => [p.id, p.name]));

    const enriched = groups.map((g) => ({
        providerId: g.provider_id,
        providerName: providerMap.get(g.provider_id) || 'Desconocido',
        amount: Number(g._sum.amount || 0),
        count: g._count.id,
        percentage: total > 0 ? parseFloat(((Number(g._sum.amount || 0) / total) * 100).toFixed(1)) : 0
    }));

    return enriched;
};

/**
 * getPayrollSummary — Resumen de nómina por empleado en el período
 */
const getPayrollSummary = async (from, to) => {
    const dateFrom = new Date(from);
    const dateTo = new Date(to);

    const aggregations = await prisma.attendanceLog.groupBy({
        by: ['employee_id'],
        where: {
            check_in: { gte: dateFrom, lte: dateTo }
        },
        _sum: { hours_worked: true, amount_earned: true },
        _count: { id: true }
    });

    // Obtener todos los usuarios y perfiles de empleados en lote
    const employeeIds = aggregations.map(agg => agg.employee_id);
    const users = await prisma.user.findMany({
        where: { id: { in: employeeIds } },
        include: { employeeProfile: true }
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    const employees = aggregations.map((agg) => {
        const user = userMap.get(agg.employee_id);
        const profile = user?.employeeProfile;
        const fullName = profile ? `${profile.first_name} ${profile.last_name}` : `@${user?.username || 'Desconocido'}`;
        const totalHours = agg._sum.hours_worked ? parseFloat(Number(agg._sum.hours_worked).toFixed(2)) : 0;

        let totalToPay = agg._sum.amount_earned ? parseFloat(Number(agg._sum.amount_earned).toFixed(2)) : 0;
        if (profile?.salary_type === 'fixed') {
            totalToPay = profile.monthly_salary ? parseFloat(Number(profile.monthly_salary)) : 0;
        }

        return {
            employeeId: agg.employee_id,
            name: fullName,
            salaryType: profile?.salary_type || 'No definido',
            hourlyRate: profile?.hourly_rate ? Number(profile.hourly_rate) : null,
            totalHours,
            shifts: agg._count.id,
            totalToPay
        };
    });

    const grandTotal = employees.reduce((sum, e) => sum + e.totalToPay, 0);
    const totalHours = employees.reduce((sum, e) => sum + e.totalHours, 0);

    return {
        employees: employees.sort((a, b) => b.totalToPay - a.totalToPay),
        grandTotal: parseFloat(grandTotal.toFixed(2)),
        totalHours: parseFloat(totalHours.toFixed(2))
    };
};

/**
 * getBudgetHealth — Estado de salud de las 3 bolsas virtuales
 * Calcula alertas basadas en el porcentaje restante vs máximo histórico de asignación
 */
const getBudgetHealth = async () => {
    const adminCtx = await getAdminContext();

    // Consultas en paralelo
    const [balances, allocations, expenses] = await Promise.all([
        prisma.budgetBalance.findMany({
            where: { user_id: adminCtx.adminId }
        }),
        prisma.budgetAllocation.groupBy({
            by: ['category'],
            where: { user_id: adminCtx.adminId },
            _sum: { amount_allocated: true }
        }),
        prisma.expense.groupBy({
            by: ['budget_category'],
            where: { status: STATUS_AMOUNT.PAID, deleted_at: null },
            _sum: { amount: true }
        })
    ]);

    const allocationMap = {};
    allocations.forEach(a => {
        allocationMap[a.category] = Number(a._sum.amount_allocated || 0);
    });

    const expenseMap = {};
    expenses.forEach(e => {
        expenseMap[e.budget_category] = Number(e._sum.amount || 0);
    });

    const categories = [
        BUDGET_CATEGORIES.MERCHANDISE,
        BUDGET_CATEGORIES.FIXED_EXPENSES,
        BUDGET_CATEGORIES.SAVINGS
    ];

    return categories.map(cat => {
        const balance = Number(balances.find(b => b.category === cat)?.balance || 0);
        const totalAllocated = allocationMap[cat] || 0;
        const totalSpent = expenseMap[cat] || 0;
        const usagePercent = totalAllocated > 0 ? ((totalSpent / totalAllocated) * 100) : 0;
        const remainingPercent = totalAllocated > 0 ? ((balance / totalAllocated) * 100) : 100;

        // Semáforo: verde > 50%, amarillo 20-50%, rojo < 20%
        let status = 'healthy';
        if (remainingPercent < 20) status = 'critical';
        else if (remainingPercent < 50) status = 'warning';

        return {
            category: cat,
            currentBalance: parseFloat(balance.toFixed(2)),
            totalAllocated: parseFloat(totalAllocated.toFixed(2)),
            totalSpent: parseFloat(totalSpent.toFixed(2)),
            usagePercent: parseFloat(usagePercent.toFixed(1)),
            remainingPercent: parseFloat(remainingPercent.toFixed(1)),
            status
        };
    });
};

module.exports = {
    getPeriodSummary,
    getCashFlow,
    getExpensesByCategory,
    getExpensesByProvider,
    getPayrollSummary,
    getBudgetHealth
};
