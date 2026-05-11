const { z } = require('zod');

const statusAmount = ["Pendiente", "Pagado"];
const paymentCondition = ["Contado", "Credito"];
const budgetCategory = ['Mercaderia', 'Ahorro', 'Gastos fijos'];

// Los porcentajes se almacenan como decimales en la DB (Decimal(3,2))
// Enviar 0.60 para representar 60%, no 60.
const pctField = (fieldName) =>
    z.number()
        .min(0, `El porcentaje de ${fieldName} debe ser mayor o igual a 0`)
        .max(1, `El porcentaje de ${fieldName} debe ser menor o igual a 1`);

const registerSchema = z.object({
    username: z.string()
        .min(6, 'El usuario debe tener al menos 6 caracteres')
        .max(20, 'El usuario no puede tener más de 20 caracteres'),
    password: z.string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres'),
    pct_merchandise: pctField('mercadería'),
    pct_fixed_expenses: pctField('gastos fijos'),
    pct_savings: pctField('ahorros'),
}).refine(
    (data) => Math.abs(data.pct_merchandise + data.pct_fixed_expenses + data.pct_savings - 1) < 0.001,
    {
        message: 'Los porcentajes deben sumar exactamente 100%',
        path: ['pct_merchandise'],
    }
);

const loginSchema = z.object({
    username: z.string()
        .min(6, 'El usuario debe tener al menos 6 caracteres')
        .max(20, 'El usuario no puede tener más de 20 caracteres'),
    password: z.string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

const dailyClosureSchema = z.object({
    total_amount: z.number().positive('El monto total debe ser mayor a 0'),
    details: z.array(z.object({
        account_id: z.number().int().positive('El ID de cuenta debe ser un entero positivo'),
        amount: z.number().nonnegative('El monto debe ser mayor o igual a 0'),
    })).min(1, 'Debe ingresar al menos un medio de pago'),
}).refine((data) => {
    const sum_details = data.details.reduce((sum, detail) => sum + detail.amount, 0);
    return Math.abs(sum_details - data.total_amount) < 0.01;
}, {
    message: 'La suma de los montos por cuenta debe coincidir con el total del cierre',
    path: ['details'],
});

const providerSchema = z.object({
    name: z.string()
        .min(3, 'El nombre del proveedor debe tener al menos 3 caracteres')
        .max(100, 'El nombre del proveedor no puede tener más de 100 caracteres'),
    payment_condition: z.enum(paymentCondition),
    credit_days: z.number().int().nonnegative('La cantidad de días debe ser mayor o igual a 0').default(0),
}).refine((data) => {
    if (data.payment_condition === 'Credito') {
        return data.credit_days > 0;
    }
    return true;
}, {
    message: 'Los proveedores a crédito deben tener una cantidad de días de crédito mayor a 0',
    path: ['credit_days'],
});

const expensesSchema = z.object({
    provider_id: z.number().int().positive('ID de proveedor inválido'),
    account_id: z.number().int().positive('ID de cuenta física inválido'),
    amount: z.number().positive('El monto debe ser mayor a 0'),
    status: z.enum(statusAmount).default('Pagado'),
    budget_category: z.enum(budgetCategory, {
        errorMap: () => ({ message: 'Categoría de presupuesto no válida' }),
    }),
    due_date: z.coerce.date().optional(),
}).refine((data) => {
    if (data.status === 'Pendiente' && !data.due_date) return false;
    return true;
}, {
    message: 'Los gastos pendientes requieren una fecha de vencimiento',
    path: ['due_date'],
});

const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ errors: result.error.errors });
    }
    req.body = result.data;
    next();
};

module.exports = {
    registerSchema,
    loginSchema,
    dailyClosureSchema,
    providerSchema,
    expensesSchema,
    validate,
};