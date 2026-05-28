/**
 * Constantes de Dominio de la Aplicación
 * * Centraliza los strings mágicos y valores constantes del negocio
 * para asegurar consistencia ortográfica y evitar errores de codificación.
 */

const BUDGET_CATEGORIES = {
    MERCHANDISE: 'Mercadería',
    FIXED_EXPENSES: 'Gastos Fijos',
    SAVINGS: 'Ahorro'
};

const ROLES = {
    ADMIN: 'ADMIN',
    EMPLOYEE: 'EMPLOYEE'
};

const STATUS_AMOUNT = {
    PENDING: 'Pendiente',
    PAID: 'Pagado'
};

const PAYMENT_CONDITIONS = {
    CASH: 'Contado',
    CREDIT: 'Credito'
};

module.exports = {
    BUDGET_CATEGORIES,
    ROLES,
    STATUS_AMOUNT,
    PAYMENT_CONDITIONS
};