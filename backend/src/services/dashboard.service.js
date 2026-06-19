const prisma = require('../config/db');

/**
 * Obtiene los ingresos (cierres de caja) y egresos (gastos pagados)
 * agrupados por mes para los últimos N meses.
 *
 * @param {number} months — Cantidad de meses hacia atrás a consultar
 * @returns {Promise<Array<{ date: string, ingresos: number, egresos: number }>>}
 */
const getIncomeVsExpenses = async (months = 6) => {
    const since = new Date();
    since.setMonth(since.getMonth() - months);
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    // Ingresos: agrupar DailyClosure.total_amount por mes
    const incomeRaw = await prisma.$queryRaw`
        SELECT
            DATE_TRUNC('month', date) AS month,
            COALESCE(SUM(total_amount), 0) AS total
        FROM "DailyClosure"
        WHERE date >= ${since}
        GROUP BY DATE_TRUNC('month', date)
        ORDER BY month ASC
    `;

    // Egresos: agrupar Expense pagados por mes (usando paid_at)
    const expenseRaw = await prisma.$queryRaw`
        SELECT
            DATE_TRUNC('month', paid_at) AS month,
            COALESCE(SUM(amount), 0) AS total
        FROM "Expense"
        WHERE status = 'Pagado'
          AND paid_at >= ${since}
        GROUP BY DATE_TRUNC('month', paid_at)
        ORDER BY month ASC
    `;

    // Construir mapa de meses para merge
    const monthMap = new Map();

    const formatKey = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}-01`;
    };

    incomeRaw.forEach((row) => {
        const key = formatKey(row.month);
        monthMap.set(key, {
            date: key,
            ingresos: Number(row.total),
            egresos: 0,
        });
    });

    expenseRaw.forEach((row) => {
        const key = formatKey(row.month);
        const existing = monthMap.get(key);
        if (existing) {
            existing.egresos = Number(row.total);
        } else {
            monthMap.set(key, {
                date: key,
                ingresos: 0,
                egresos: Number(row.total),
            });
        }
    });

    const result = Array.from(monthMap.values());
    result.sort((a, b) => a.date.localeCompare(b.date));

    return result;
};

/**
 * Obtiene las últimas N acciones del registro de auditoría
 * para mostrar un feed de actividad reciente en el dashboard.
 *
 * @param {number} limit — Cantidad de registros a devolver
 * @returns {Promise<Array<{ id, action, details, created_at, user: { username, role } }>>}
 */
const getRecentActivity = async (limit = 10) => {
    return prisma.auditLog.findMany({
        orderBy: { created_at: 'desc' },
        take: limit,
        select: {
            id: true,
            action: true,
            details: true,
            created_at: true,
            user: {
                select: {
                    username: true,
                    role: true,
                }
            }
        }
    });
};

/**
 * Reconstruye el historial de saldos mensuales para dinero total, cuenta bancaria y efectivo.
 *
 * @param {number} months — Cantidad de meses hacia atrás a consultar
 * @returns {Promise<{ total: Array, bank: Array, cash: Array }>}
 */
const getAccountHistory = async (months = 6) => {
    const { getAdminContext } = require('../utils/adminContext');
    const adminCtx = await getAdminContext();
    const adminId = adminCtx.adminId;

    const accounts = await prisma.account.findMany({
        where: { user_id: adminId }
    });

    const historyPoints = [];
    const now = new Date();

    for (let i = 0; i < months; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i + 1, 0); // Fin de mes de hace i meses
        d.setHours(23, 59, 59, 999);
        historyPoints.push({
            label: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`, // Primer día del mes como key de gráfico
            dateLimitTime: d.getTime(),
        });
    }
    historyPoints.reverse();

    const oldestDateTime = historyPoints[0].dateLimitTime;
    const oldestDate = new Date(oldestDateTime);

    const closuresAfter = await prisma.dailyClosureDetail.findMany({
        where: {
            closure: {
                date: { gt: oldestDate }
            }
        },
        include: {
            closure: true
        }
    });

    const expensesAfter = await prisma.expense.findMany({
        where: {
            status: 'Pagado',
            paid_at: { gt: oldestDate }
        }
    });

    // Mapear a objetos planos con timestamps precalculados para comparaciones de números enteros ultrarrápidas
    const closuresProcessed = closuresAfter.map(c => ({
        account_id: c.account_id,
        amount: Number(c.amount),
        time: c.closure.date.getTime()
    }));

    const expensesProcessed = expensesAfter.map(e => ({
        account_id: e.account_id,
        amount: Number(e.amount),
        time: e.paid_at ? e.paid_at.getTime() : 0
    }));

    const accountsHistory = {};
    const totalHistory = historyPoints.map(point => ({ date: point.label, amount: 0 }));

    accounts.forEach(acc => {
        accountsHistory[acc.id] = [];
        const currentBal = Number(acc.balance);

        // Filtrar cierres y egresos por cuenta una sola vez fuera del bucle de meses
        const accClosures = closuresProcessed.filter(c => c.account_id === acc.id);
        const accExpenses = expensesProcessed.filter(e => e.account_id === acc.id);

        historyPoints.forEach((point, idx) => {
            // Comparar números enteros en lugar de objetos Date evita consumo de CPU ineficiente
            const subsequentClosures = accClosures
                .filter(c => c.time > point.dateLimitTime)
                .reduce((sum, c) => sum + c.amount, 0);

            const subsequentExpenses = accExpenses
                .filter(e => e.time > point.dateLimitTime)
                .reduce((sum, e) => sum + e.amount, 0);

            const histBalance = currentBal - subsequentClosures + subsequentExpenses;
            const finalAmount = Math.max(0, histBalance);

            accountsHistory[acc.id].push({
                date: point.label,
                amount: finalAmount
            });

            totalHistory[idx].amount += finalAmount;
        });
    });

    // Identificar cuenta bancaria y efectivo por su nombre
    const bankAcc = accounts.find(a => a.name.toLowerCase().includes('banc') || a.name.toLowerCase().includes('bank') || a.name.toLowerCase().includes('transfer') || a.name.toLowerCase().includes('transf'));
    const cashAcc = accounts.find(a => a.name.toLowerCase().includes('efec') || a.name.toLowerCase().includes('caja') || a.name.toLowerCase().includes('cash'));

    const bankHistory = bankAcc && accountsHistory[bankAcc.id]
        ? accountsHistory[bankAcc.id]
        : historyPoints.map(p => ({ date: p.label, amount: 0 }));

    const cashHistory = cashAcc && accountsHistory[cashAcc.id]
        ? accountsHistory[cashAcc.id]
        : historyPoints.map(p => ({ date: p.label, amount: 0 }));

    return {
        total: totalHistory,
        bank: bankHistory,
        cash: cashHistory
    };
};

module.exports = { getIncomeVsExpenses, getRecentActivity, getAccountHistory };


