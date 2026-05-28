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

    // Ordenar cronológicamente
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

module.exports = { getIncomeVsExpenses, getRecentActivity };

