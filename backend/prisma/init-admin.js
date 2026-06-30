const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Limpiando la base de datos completa...');
    
    // Limpiar todas las tablas principales (en orden para evitar problemas de Foreign Keys)
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

    console.log('👤 Creando usuario Administrador inicial...');
    
    // El usuario se crea con contraseña por defecto y must_change_password: true
    const admin = await prisma.user.create({
        data: {
            username: 'laulopez',
            password_hash: bcrypt.hashSync('iniciar123', 10),
            email: 'admin@gestorfinanciero.com',
            role: 'ADMIN',
            must_change_password: true, // Esto fuerza el cambio de contraseña al primer login
            pct_merchandise: 0.60,
            pct_fixed_expenses: 0.30,
            pct_savings: 0.10,
        }
    });

    console.log('✅ Base de datos limpiada y Administrador creado exitosamente!');
}

main()
    .catch((e) => {
        console.error('❌ Error al inicializar:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
