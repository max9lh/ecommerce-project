const prisma = require('../config/db');
const { getAdminContext } = require('../utils/adminContext');
const { STATUS_AMOUNT } = require('../utils/constants');
const Decimal = require('decimal.js');

// ============================================================
// HELPERS — Utilidades de fecha (UTC)
// ============================================================

/**
 * Retorna el último día del mes para una fecha dada.
 */
const getLastDayOfMonth = (date) => {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
};

/**
 * Genera un rango de fechas UTC desde `start` por `days` días.
 */
const generateDateRange = (start, days) => {
    const dates = [];
    for (let i = 0; i < days; i++) {
        const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + i));
        dates.push(d);
    }
    return dates;
};

/**
 * Normaliza una fecha a midnight UTC.
 */
const toUTCMidnight = (date) => {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

// ============================================================
// CORE — Motor de Proyección
// ============================================================

/**
 * generateProjection — Genera una proyección de caja multi-escenario.
 *
 * @param {Object} params
 * @param {number} params.userId       — ID del usuario autenticado
 * @param {number} params.days         — Horizonte de proyección (default 30)
 * @param {number|Object} params.basePeriodDays — 7, 14, 30 o { from: Date, to: Date }
 * @param {number} params.safetyBuffer — Colchón mínimo de caja deseado (default 0)
 * @returns {Object} Resultado de la proyección
 */
const generateProjection = async ({ userId, days = 30, basePeriodDays = 14, safetyBuffer = 0 }) => {
    const adminCtx = await getAdminContext();
    const safetyBuf = new Decimal(safetyBuffer);

    // ── 1. Saldo inicial: suma de todas las cuentas del ADMIN ──
    const initialBalance = adminCtx.accounts.reduce(
        (sum, acc) => sum.plus(new Decimal(acc.balance.toString())),
        new Decimal(0)
    );

    // ── 2. Período base para calcular ingreso promedio diario ──
    let periodFrom, periodTo;
    const now = new Date();

    if (typeof basePeriodDays === 'object' && basePeriodDays.from && basePeriodDays.to) {
        periodFrom = new Date(basePeriodDays.from);
        periodTo = new Date(basePeriodDays.to);
    } else {
        const numDays = parseInt(basePeriodDays, 10) || 14;
        periodTo = toUTCMidnight(now);
        periodFrom = new Date(Date.UTC(
            periodTo.getUTCFullYear(),
            periodTo.getUTCMonth(),
            periodTo.getUTCDate() - numDays
        ));
    }

    const closures = await prisma.dailyClosure.findMany({
        where: {
            date: {
                gte: periodFrom,
                lte: periodTo
            }
        },
        select: { total_amount: true, date: true }
    });

    const totalIncome = closures.reduce(
        (sum, c) => sum.plus(new Decimal(c.total_amount.toString())),
        new Decimal(0)
    );

    const periodDays = Math.max(1, Math.ceil((periodTo - periodFrom) / (1000 * 60 * 60 * 24)));
    const baseDailyIncome = totalIncome.div(periodDays);

    // ── 3. Recopilar gastos ──
    // 3a. Gastos pendientes desde hoy hasta el límite de la proyección
    const today = toUTCMidnight(now);
    const projectionEndDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + days));

    const pendingExpenses = await prisma.expense.findMany({
        where: {
            status: STATUS_AMOUNT.PENDING,
            deleted_at: null,
            due_date: {
                gte: today,
                lte: projectionEndDate
            }
        },
        include: {
            provider: { select: { name: true } }
        }
    });

    // 3b. Gastos recurrentes activos
    const recurringExpenses = await prisma.recurringExpense.findMany({
        where: {
            user_id: adminCtx.adminId,
            is_active: true
        },
        select: { name: true, amount: true, due_day: true, category: true, frequency: true }
    });

    // ── 4. Generar proyección día por día ──
    const dateRange = generateDateRange(today, days);
    const currentMonth = today.getUTCMonth();
    const currentYear = today.getUTCFullYear();

    const scenarios = {
        pessimistic: [],
        realistic: [],
        optimistic: []
    };

    const multipliers = {
        pessimistic: new Decimal('0.6'),
        realistic: new Decimal('1.0'),
        optimistic: new Decimal('1.2')
    };

    // Calcular gastos por fecha
    const expensesByDate = new Map();

    for (const date of dateRange) {
        const dateKey = date.toISOString().split('T')[0];
        const dateMonth = date.getUTCMonth();
        const dateYear = date.getUTCFullYear();
        const dateDay = date.getUTCDate();
        const lastDay = getLastDayOfMonth(date);
        const isLastDay = dateDay === lastDay;
        const isCurrentMonth = (dateMonth === currentMonth && dateYear === currentYear);

        let dayExpenses = [];

        // Gastos pendientes reales programados para este día
        const realExpensesForDay = pendingExpenses
            .filter(exp => {
                const expDate = toUTCMidnight(new Date(exp.due_date));
                return expDate.getTime() === date.getTime();
            })
            .map(exp => ({
                name: exp.provider ? `${exp.provider.name} (Pendiente)` : `${exp.budget_category} (Pendiente)`,
                amount: new Decimal(exp.amount.toString()),
                category: exp.budget_category
            }));

        // Gastos recurrentes simulados para este día
        const simExpensesForDay = recurringExpenses
            .filter(re => {
                if (re.frequency === 'weekly') {
                    // re.due_day representa el día de la semana (0 = Domingo, 1 = Lunes, etc.)
                    const dayOfWeek = date.getUTCDay();
                    return re.due_day === dayOfWeek;
                } else {
                    // Mensual
                    if (re.due_day === dateDay) return true;
                    // Si due_day > último día del mes y es el último día → incluir
                    if (re.due_day > lastDay && isLastDay) return true;
                    return false;
                }
            })
            .map(re => ({
                name: `${re.name} (Recurrente)`,
                amount: new Decimal(re.amount.toString()),
                category: re.category
            }));

        // Unimos ambos tipos de gastos para la proyección diaria
        dayExpenses = [...realExpensesForDay, ...simExpensesForDay];

        expensesByDate.set(dateKey, dayExpenses);
    }

    // Generar las curvas para cada escenario
    for (const [scenario, multiplier] of Object.entries(multipliers)) {
        let balance = new Decimal(initialBalance);
        const dailyIncome = baseDailyIncome.times(multiplier);

        for (const date of dateRange) {
            const dateKey = date.toISOString().split('T')[0];

            // Sumar ingreso diario
            balance = balance.plus(dailyIncome);

            // Restar gastos del día
            const dayExpenses = expensesByDate.get(dateKey) || [];
            for (const exp of dayExpenses) {
                balance = balance.minus(exp.amount);
            }

            scenarios[scenario].push({
                date: dateKey,
                balance: balance.toDecimalPlaces(2).toNumber(),
                expenses: dayExpenses.map(e => ({
                    name: e.name,
                    amount: e.amount.toNumber(),
                    category: e.category
                }))
            });
        }
    }

    // ── 5. Capacidad de compra segura ──
    // Mínimo local de la curva realista
    const realisticBalances = scenarios.realistic.map(p => new Decimal(p.balance));
    const minBalance = Decimal.min(...realisticBalances);
    const safeSpendingCapacity = Decimal.max(minBalance.minus(safetyBuf), new Decimal(0)).toDecimalPlaces(2).toNumber();

    // ── 6. Semáforo de liquidez ──
    let liquidityStatus = 'GREEN';
    let collapseDay = null;

    // Buscar si algún punto cae por debajo de 0
    const collapsePt = scenarios.realistic.find(p => p.balance < 0);
    if (collapsePt) {
        liquidityStatus = 'RED';
        collapseDay = collapsePt.date;
    } else {
        // Comprobar si se acerca al safetyBuffer (dentro del 20% del buffer)
        const bufferThreshold = safetyBuf.times(new Decimal('1.2'));
        const nearBuffer = scenarios.realistic.some(p => {
            const bal = new Decimal(p.balance);
            return bal.lte(bufferThreshold) && bal.gte(safetyBuf);
        });

        if (nearBuffer || minBalance.lte(safetyBuf)) {
            liquidityStatus = 'YELLOW';
        }
    }

    return {
        scenarios: {
            pessimistic: scenarios.pessimistic.map(p => ({ date: p.date, balance: p.balance })),
            realistic: scenarios.realistic,
            optimistic: scenarios.optimistic.map(p => ({ date: p.date, balance: p.balance }))
        },
        safeSpendingCapacity,
        liquidityStatus,
        collapseDay,
        baseDailyIncome: baseDailyIncome.toDecimalPlaces(2).toNumber(),
        periodUsed: {
            from: periodFrom.toISOString().split('T')[0],
            to: periodTo.toISOString().split('T')[0],
            days: periodDays,
            closuresFound: closures.length
        }
    };
};

module.exports = { generateProjection };
