const prisma = require('../config/db');
const { ROLES } = require('./constants');

let cachedAdminContext = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 30 * 1000; // 30 segundos de TTL

/**
 * getAdminContext — Obtiene el contexto del Administrador principal
 * * En un esquema de negocio local, todas las cuentas físicas y bolsas virtuales
 * de presupuesto pertenecen al Administrador. Este helper unifica el acceso
 * para que tanto administradores como empleados operen sobre las mismas entidades.
 */
const getAdminContext = async () => {
    const now = Date.now();
    if (cachedAdminContext && (now - cacheTimestamp < CACHE_TTL_MS)) {
        return cachedAdminContext;
    }

    const admin = await prisma.user.findFirst({
        where: { role: ROLES.ADMIN },
        include: {
            accounts: true,
            budget_balances: true
        }
    });

    if (!admin) {
        const error = new Error('Configuración inválida: No existe un administrador registrado en el sistema.');
        error.statusCode = 500;
        throw error;
    }

    cachedAdminContext = {
        adminId: admin.id,
        pct: {
            merchandise: Number(admin.pct_merchandise),
            fixed_expenses: Number(admin.pct_fixed_expenses),
            savings: Number(admin.pct_savings)
        },
        accounts: admin.accounts,
        budgets: admin.budget_balances
    };
    cacheTimestamp = now;

    return cachedAdminContext;
};

/**
 * Invalida la caché del contexto del administrador.
 * Debe llamarse al actualizar cuentas físicas, balances o porcentajes.
 */
const clearAdminContextCache = () => {
    cachedAdminContext = null;
    cacheTimestamp = 0;
};

module.exports = { getAdminContext, clearAdminContextCache };