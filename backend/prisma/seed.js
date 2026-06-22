// backend/prisma/seed.js
// ============================================================
// Seed de datos realistas — equivalente a 2 meses de operación
// ============================================================
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

// ── Helpers ──
const BCRYPT_ROUNDS = 12;
const hash = (pw) => bcrypt.hashSync(pw, BCRYPT_ROUNDS);

/** Retorna una fecha UTC a medianoche para un offset de días desde hoy */
function daysAgo(n) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - n);
    d.setUTCHours(0, 0, 0, 0);
    return d;
}

/** Retorna una fecha UTC futura */
function daysFromNow(n) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + n);
    d.setUTCHours(12, 0, 0, 0);
    return d;
}

/** Hora aleatoria de check-in (7-10 AM) */
function randomCheckIn(date) {
    const d = new Date(date);
    d.setUTCHours(7 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60), 0, 0);
    return d;
}

/** Hora aleatoria de check-out (16-19 PM) */
function randomCheckOut(date) {
    const d = new Date(date);
    d.setUTCHours(16 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60), 0, 0);
    return d;
}

// ── Constantes de dominio (replicadas de constants.js) ──
const BUDGET_CATEGORIES = {
    MERCHANDISE: 'Mercadería',
    FIXED_EXPENSES: 'Gastos Fijos',
    SAVINGS: 'Ahorro'
};

const STATUS = { PENDING: 'Pendiente', PAID: 'Pagado' };

async function main() {
    console.log('🌱 Limpiando base de datos...');
    // Borrar en orden inverso de dependencias
    await prisma.passwordResetToken.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.budgetAllocation.deleteMany();
    await prisma.budgetBalance.deleteMany();
    await prisma.dailyClosureDetail.deleteMany();
    await prisma.dailyClosure.deleteMany();
    await prisma.attendanceLog.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.recurringExpense.deleteMany();
    await prisma.provider.deleteMany();
    await prisma.account.deleteMany();
    await prisma.employeeProfile.deleteMany();
    await prisma.employeePermission.deleteMany();
    await prisma.user.deleteMany();

    console.log('👤 Creando administrador...');
    const admin = await prisma.user.create({
        data: {
            username: 'administrador',
            password_hash: hash('admin123'),
            email: 'admin@gestorfinanciero.com',
            role: 'ADMIN',
            must_change_password: false,
            pct_merchandise: 0.60,
            pct_fixed_expenses: 0.30,
            pct_savings: 0.10,
        }
    });

    // ── Cuentas físicas del Admin ──
    console.log('🏦 Creando cuentas...');
    const cashAccount = await prisma.account.create({
        data: { user_id: admin.id, name: 'Efectivo', balance: 0 }
    });
    const bankAccount = await prisma.account.create({
        data: { user_id: admin.id, name: 'Cuenta Bancaria', balance: 0 }
    });

    // ── Empleados ──
    console.log('👥 Creando empleados...');
    const emp1 = await prisma.user.create({
        data: {
            username: 'maria.lopez',
            password_hash: hash('empleado123'),
            email: 'maria@gestorfinanciero.com',
            role: 'EMPLOYEE',
            must_change_password: false,
        }
    });
    await prisma.employeeProfile.create({
        data: {
            user_id: emp1.id,
            first_name: 'María',
            last_name: 'López',
            salary_type: 'hourly',
            hourly_rate: 1500.00,
        }
    });
    await prisma.employeePermission.create({
        data: {
            user_id: emp1.id,
            canRegisterClosures: true,
            canRegisterExpenses: true,
            canPayExpenses: false,
            canManageProviders: false,
        }
    });

    const emp2 = await prisma.user.create({
        data: {
            username: 'juan.perez',
            password_hash: hash('empleado123'),
            email: 'juan@gestorfinanciero.com',
            role: 'EMPLOYEE',
            must_change_password: false,
        }
    });
    await prisma.employeeProfile.create({
        data: {
            user_id: emp2.id,
            first_name: 'Juan',
            last_name: 'Pérez',
            salary_type: 'fixed',
            hourly_rate: 0,
            monthly_salary: 350000.00,
        }
    });
    await prisma.employeePermission.create({
        data: {
            user_id: emp2.id,
            canRegisterClosures: true,
            canRegisterExpenses: true,
            canPayExpenses: true,
            canManageProviders: true,
        }
    });

    // ── Proveedores ──
    console.log('🏪 Creando proveedores...');
    const providerNames = [
        { name: 'Distribuidora Norte SRL', condition: 'Credito', credit_days: 30 },
        { name: 'Alimentos del Sur', condition: 'Credito', credit_days: 15 },
        { name: 'Papelería Central', condition: 'Contado', credit_days: 0 },
        { name: 'Limpieza Total', condition: 'Contado', credit_days: 0 },
        { name: 'Bebidas Express', condition: 'Credito', credit_days: 21 },
        { name: 'Ferretería Gómez', condition: 'Contado', credit_days: 0 },
    ];
    const providers = [];
    for (const p of providerNames) {
        const prov = await prisma.provider.create({
            data: {
                user_id: admin.id,
                name: p.name,
                payment_condition: p.condition,
                credit_days: p.credit_days,
                visible_to_employee: true,
            }
        });
        providers.push(prov);
    }

    // ── Gastos Recurrentes ──
    console.log('🔁 Creando gastos recurrentes...');
    await prisma.recurringExpense.createMany({
        data: [
            { user_id: admin.id, name: 'Alquiler Local', amount: 180000, due_day: 10, category: BUDGET_CATEGORIES.FIXED_EXPENSES, frequency: 'monthly' },
            { user_id: admin.id, name: 'Servicio de Internet', amount: 15000, due_day: 15, category: BUDGET_CATEGORIES.FIXED_EXPENSES, frequency: 'monthly' },
            { user_id: admin.id, name: 'Limpieza Semanal', amount: 8000, due_day: 1, category: BUDGET_CATEGORIES.FIXED_EXPENSES, frequency: 'weekly' },
        ]
    });

    // ══════════════════════════════════════════════════════════
    // CIERRES DE CAJA — 60 días (Lun-Sáb, ~50 cierres)
    // ══════════════════════════════════════════════════════════
    console.log('💰 Generando cierres de caja (2 meses)...');
    const auditLogs = [];
    let totalCashBalance = 0;
    let totalBankBalance = 0;
    let budgetMerchandise = 0;
    let budgetFixed = 0;
    let budgetSavings = 0;

    // Generar días laborales de los últimos 60 días
    const workDays = [];
    for (let i = 60; i >= 1; i--) {
        const d = daysAgo(i);
        const dow = d.getUTCDay(); // 0=Dom, 6=Sab
        if (dow >= 1 && dow <= 6) workDays.push(d); // Lun-Sab
    }

    // Patrones de ventas realistas (varía por día de la semana)
    const salesPatterns = {
        1: { min: 25000, max: 55000 },  // Lunes (bajo)
        2: { min: 30000, max: 60000 },  // Martes
        3: { min: 35000, max: 65000 },  // Miércoles
        4: { min: 40000, max: 70000 },  // Jueves
        5: { min: 50000, max: 90000 },  // Viernes (alto)
        6: { min: 60000, max: 110000 }, // Sábado (pico)
    };

    for (const day of workDays) {
        const dow = day.getUTCDay();
        const pattern = salesPatterns[dow];
        const totalAmount = Math.round(pattern.min + Math.random() * (pattern.max - pattern.min));

        // Distribución realista: ~60% efectivo, ~40% banco (con variación)
        const cashPct = 0.50 + Math.random() * 0.25;
        const cashAmount = Math.round(totalAmount * cashPct);
        const bankAmount = totalAmount - cashAmount;

        // Distribución presupuestaria
        const merchAmount = +(totalAmount * 0.60).toFixed(2);
        const fixedAmount = +(totalAmount * 0.30).toFixed(2);
        const savAmount = +(totalAmount * 0.10).toFixed(2);

        // Quien registra el cierre (alternar entre admin y empleados)
        const registradores = [admin.id, emp1.id, emp2.id];
        const registrador = registradores[Math.floor(Math.random() * registradores.length)];

        const closure = await prisma.dailyClosure.create({
            data: {
                user_id: registrador,
                total_amount: totalAmount,
                date: day,
            }
        });

        await prisma.dailyClosureDetail.createMany({
            data: [
                { closure_id: closure.id, account_id: cashAccount.id, amount: cashAmount },
                { closure_id: closure.id, account_id: bankAccount.id, amount: bankAmount },
            ]
        });

        await prisma.budgetAllocation.createMany({
            data: [
                { closure_id: closure.id, user_id: admin.id, amount_allocated: merchAmount, category: BUDGET_CATEGORIES.MERCHANDISE },
                { closure_id: closure.id, user_id: admin.id, amount_allocated: fixedAmount, category: BUDGET_CATEGORIES.FIXED_EXPENSES },
                { closure_id: closure.id, user_id: admin.id, amount_allocated: savAmount, category: BUDGET_CATEGORIES.SAVINGS },
            ]
        });

        totalCashBalance += cashAmount;
        totalBankBalance += bankAmount;
        budgetMerchandise += merchAmount;
        budgetFixed += fixedAmount;
        budgetSavings += savAmount;

        auditLogs.push({
            user_id: registrador,
            action: 'REGISTRAR_CIERRE',
            details: `Registró un cierre de caja por un total de $${totalAmount.toFixed(2)}`,
            created_at: day,
        });
    }

    // ══════════════════════════════════════════════════════════
    // EGRESOS — Pagados y Pendientes
    // ══════════════════════════════════════════════════════════
    console.log('📉 Generando egresos...');

    // Egresos PAGADOS a lo largo de los 2 meses
    const paidExpenses = [
        // Mercadería (proveedor a crédito y contado)
        { prov: 0, cat: BUDGET_CATEGORIES.MERCHANDISE, amount: 45000, daysBack: 55, acct: cashAccount.id },
        { prov: 0, cat: BUDGET_CATEGORIES.MERCHANDISE, amount: 38000, daysBack: 40, acct: bankAccount.id },
        { prov: 1, cat: BUDGET_CATEGORIES.MERCHANDISE, amount: 22000, daysBack: 35, acct: cashAccount.id },
        { prov: 4, cat: BUDGET_CATEGORIES.MERCHANDISE, amount: 18500, daysBack: 28, acct: cashAccount.id },
        { prov: 0, cat: BUDGET_CATEGORIES.MERCHANDISE, amount: 52000, daysBack: 20, acct: bankAccount.id },
        { prov: 1, cat: BUDGET_CATEGORIES.MERCHANDISE, amount: 29000, daysBack: 14, acct: cashAccount.id },
        { prov: 4, cat: BUDGET_CATEGORIES.MERCHANDISE, amount: 15000, daysBack: 7, acct: bankAccount.id },
        { prov: 2, cat: BUDGET_CATEGORIES.MERCHANDISE, amount: 8500, daysBack: 3, acct: cashAccount.id },
        // Gastos Fijos
        { prov: 3, cat: BUDGET_CATEGORIES.FIXED_EXPENSES, amount: 180000, daysBack: 50, acct: bankAccount.id },
        { prov: 3, cat: BUDGET_CATEGORIES.FIXED_EXPENSES, amount: 180000, daysBack: 20, acct: bankAccount.id },
        { prov: 5, cat: BUDGET_CATEGORIES.FIXED_EXPENSES, amount: 12000, daysBack: 45, acct: cashAccount.id },
        { prov: 5, cat: BUDGET_CATEGORIES.FIXED_EXPENSES, amount: 9500, daysBack: 15, acct: cashAccount.id },
        { prov: 2, cat: BUDGET_CATEGORIES.FIXED_EXPENSES, amount: 7200, daysBack: 30, acct: cashAccount.id },
        { prov: 2, cat: BUDGET_CATEGORIES.FIXED_EXPENSES, amount: 5800, daysBack: 10, acct: cashAccount.id },
    ];

    for (const exp of paidExpenses) {
        const paidDate = daysAgo(exp.daysBack);
        const registradores = [admin.id, emp1.id, emp2.id];
        const registrador = registradores[Math.floor(Math.random() * registradores.length)];

        await prisma.expense.create({
            data: {
                user_id: registrador,
                provider_id: providers[exp.prov].id,
                account_id: exp.acct,
                budget_category: exp.cat,
                amount: exp.amount,
                status: STATUS.PAID,
                paid_at: paidDate,
                created_at: paidDate,
            }
        });

        if (exp.acct === cashAccount.id) totalCashBalance -= exp.amount;
        else totalBankBalance -= exp.amount;

        if (exp.cat === BUDGET_CATEGORIES.MERCHANDISE) budgetMerchandise -= exp.amount;
        else if (exp.cat === BUDGET_CATEGORIES.FIXED_EXPENSES) budgetFixed -= exp.amount;
        else budgetSavings -= exp.amount;

        auditLogs.push({
            user_id: registrador,
            action: 'REGISTRAR_EGRESO',
            details: `Registró un egreso de tipo "${exp.cat}" por un monto de $${exp.amount.toFixed(2)} (Estado: Pagado)`,
            created_at: paidDate,
        });
    }

    // Egresos PENDIENTES (facturas a crédito por vencer)
    const pendingExpenses = [
        { prov: 0, cat: BUDGET_CATEGORIES.MERCHANDISE, amount: 67000, dueDays: 5 },
        { prov: 1, cat: BUDGET_CATEGORIES.MERCHANDISE, amount: 34500, dueDays: 8 },
        { prov: 4, cat: BUDGET_CATEGORIES.MERCHANDISE, amount: 21000, dueDays: 12 },
        { prov: 0, cat: BUDGET_CATEGORIES.MERCHANDISE, amount: 43000, dueDays: 20 },
        { prov: 1, cat: BUDGET_CATEGORIES.FIXED_EXPENSES, amount: 15000, dueDays: 3 },
    ];

    for (const exp of pendingExpenses) {
        const createdDate = daysAgo(Math.floor(Math.random() * 10) + 1);
        await prisma.expense.create({
            data: {
                user_id: admin.id,
                provider_id: providers[exp.prov].id,
                account_id: cashAccount.id,
                budget_category: exp.cat,
                amount: exp.amount,
                status: STATUS.PENDING,
                due_date: daysFromNow(exp.dueDays),
                created_at: createdDate,
            }
        });
        auditLogs.push({
            user_id: admin.id,
            action: 'REGISTRAR_EGRESO',
            details: `Registró un egreso de tipo "${exp.cat}" por un monto de $${exp.amount.toFixed(2)} (Estado: Pendiente)`,
            created_at: createdDate,
        });
    }

    // ══════════════════════════════════════════════════════════
    // ASISTENCIA — Turnos de los 2 empleados en los últimos 60 días
    // ══════════════════════════════════════════════════════════
    console.log('⏰ Generando registros de asistencia...');

    for (const day of workDays) {
        const dow = day.getUTCDay();

        // María (por hora) trabaja Lun-Vie
        if (dow >= 1 && dow <= 5) {
            const checkIn = randomCheckIn(day);
            const checkOut = randomCheckOut(day);
            const diffMs = checkOut - checkIn;
            const hoursWorked = +(diffMs / (1000 * 60 * 60)).toFixed(2);
            const amountEarned = +(hoursWorked * 1500).toFixed(2);

            await prisma.attendanceLog.create({
                data: {
                    employee_id: emp1.id,
                    check_in: checkIn,
                    check_out: checkOut,
                    hours_worked: hoursWorked,
                    amount_earned: amountEarned,
                    created_at: day,
                }
            });
        }

        // Juan (sueldo fijo) trabaja Lun-Sáb
        if (dow >= 1 && dow <= 6) {
            const checkIn = randomCheckIn(day);
            const checkOut = randomCheckOut(day);
            const diffMs = checkOut - checkIn;
            const hoursWorked = +(diffMs / (1000 * 60 * 60)).toFixed(2);

            await prisma.attendanceLog.create({
                data: {
                    employee_id: emp2.id,
                    check_in: checkIn,
                    check_out: checkOut,
                    hours_worked: hoursWorked,
                    amount_earned: 0, // Sueldo fijo, no se calcula por hora
                    created_at: day,
                }
            });
        }
    }

    // ══════════════════════════════════════════════════════════
    // SALDOS FINALES — Actualizar cuentas y bolsas
    // ══════════════════════════════════════════════════════════
    console.log('💳 Actualizando saldos finales...');

    await prisma.account.update({
        where: { id: cashAccount.id },
        data: { balance: Math.max(0, totalCashBalance) }
    });
    await prisma.account.update({
        where: { id: bankAccount.id },
        data: { balance: Math.max(0, totalBankBalance) }
    });

    // Bolsas presupuestarias
    const budgets = [
        { category: BUDGET_CATEGORIES.MERCHANDISE, balance: budgetMerchandise },
        { category: BUDGET_CATEGORIES.FIXED_EXPENSES, balance: budgetFixed },
        { category: BUDGET_CATEGORIES.SAVINGS, balance: budgetSavings },
    ];
    for (const b of budgets) {
        await prisma.budgetBalance.upsert({
            where: { user_id_category: { user_id: admin.id, category: b.category } },
            update: { balance: Math.max(0, +b.balance.toFixed(2)) },
            create: { user_id: admin.id, category: b.category, balance: Math.max(0, +b.balance.toFixed(2)) },
        });
    }

    // ══════════════════════════════════════════════════════════
    // AUDIT LOGS — Insertar toda la auditoría ordenada
    // ══════════════════════════════════════════════════════════
    console.log('📋 Insertando registros de auditoría...');

    // Agregar logs del registro de usuarios
    auditLogs.push(
        { user_id: admin.id, action: 'REGISTRO_USUARIO', details: 'Se registró el administrador del sistema', created_at: daysAgo(61) },
        { user_id: admin.id, action: 'CREAR_EMPLEADO', details: `Creó la cuenta del empleado "maria.lopez" (María López)`, created_at: daysAgo(61) },
        { user_id: admin.id, action: 'CREAR_EMPLEADO', details: `Creó la cuenta del empleado "juan.perez" (Juan Pérez)`, created_at: daysAgo(61) },
        { user_id: admin.id, action: 'CREAR_PROVEEDOR', details: 'Creó el proveedor "Distribuidora Norte SRL"', created_at: daysAgo(61) },
        { user_id: admin.id, action: 'CREAR_PROVEEDOR', details: 'Creó el proveedor "Alimentos del Sur"', created_at: daysAgo(61) },
        { user_id: admin.id, action: 'CREAR_PROVEEDOR', details: 'Creó el proveedor "Papelería Central"', created_at: daysAgo(61) },
        { user_id: admin.id, action: 'CREAR_PROVEEDOR', details: 'Creó el proveedor "Limpieza Total"', created_at: daysAgo(61) },
        { user_id: admin.id, action: 'CREAR_PROVEEDOR', details: 'Creó el proveedor "Bebidas Express"', created_at: daysAgo(61) },
        { user_id: admin.id, action: 'CREAR_PROVEEDOR', details: 'Creó el proveedor "Ferretería Gómez"', created_at: daysAgo(61) },
        { user_id: admin.id, action: 'CREAR_GASTO_RECURRENTE', details: 'Creó gasto recurrente mensual "Alquiler Local" por $180000.00', created_at: daysAgo(60) },
        { user_id: admin.id, action: 'CREAR_GASTO_RECURRENTE', details: 'Creó gasto recurrente mensual "Servicio de Internet" por $15000.00', created_at: daysAgo(60) },
        { user_id: admin.id, action: 'CREAR_GASTO_RECURRENTE', details: 'Creó gasto recurrente semanal "Limpieza Semanal" por $8000.00', created_at: daysAgo(60) },
    );

    // Ordenar cronológicamente
    auditLogs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    await prisma.auditLog.createMany({ data: auditLogs });

    // ══════════════════════════════════════════════════════════
    // RESUMEN
    // ══════════════════════════════════════════════════════════
    const closureCount = await prisma.dailyClosure.count();
    const expenseCount = await prisma.expense.count();
    const attendanceCount = await prisma.attendanceLog.count();
    const auditCount = await prisma.auditLog.count();

    console.log('\n✅ Seed completado exitosamente!');
    console.log('═══════════════════════════════════════');
    console.log(`   👤 Admin: administrador / admin123`);
    console.log(`   👷 Empleado 1: maria.lopez / empleado123 (por hora: $1500/h)`);
    console.log(`   👷 Empleado 2: juan.perez / empleado123 (fijo: $350.000/mes)`);
    console.log(`   🏪 Proveedores: ${providers.length}`);
    console.log(`   💰 Cierres de caja: ${closureCount}`);
    console.log(`   📉 Egresos: ${expenseCount}`);
    console.log(`   ⏰ Registros de asistencia: ${attendanceCount}`);
    console.log(`   📋 Registros de auditoría: ${auditCount}`);
    console.log(`   💵 Saldo Efectivo: $${Math.max(0, totalCashBalance).toLocaleString()}`);
    console.log(`   🏦 Saldo Banco: $${Math.max(0, totalBankBalance).toLocaleString()}`);
    console.log('═══════════════════════════════════════\n');
}

main()
    .catch((e) => {
        console.error('❌ Error en seed:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
