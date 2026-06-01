const { PrismaClient } = require('@prisma/client');
const marzoData = require('./marzo_data.json');
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando la carga de datos de Marzo desde el Excel...');

  // 1. Obtener el ADMIN principal del sistema
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN', deleted_at: null },
    include: { accounts: true, budget_balances: true }
  });

  if (!admin) {
    console.error('❌ Error: No se encontró ningún usuario ADMINISTRADOR activo en la base de datos.');
    process.exit(1);
  }

  console.log(`👤 Administrador encontrado: ${admin.username} (ID: ${admin.id})`);

  // Asegurarnos de tener al menos una cuenta física para el ADMIN
  let account = admin.accounts[0];
  if (!account) {
    account = await prisma.account.create({
      data: {
        user_id: admin.id,
        name: 'Caja Principal CLP',
        balance: 0.00
      }
    });
    console.log(`➕ Creada cuenta física por defecto: ${account.name}`);
  }

  // Asegurarnos de tener las bolsas virtuales de presupuesto
  const requiredCategories = ['Mercadería', 'Gastos Fijos', 'Ahorro'];
  for (const cat of requiredCategories) {
    const existing = await prisma.budgetBalance.findUnique({
      where: { user_id_category: { user_id: admin.id, category: cat } }
    });
    if (!existing) {
      await prisma.budgetBalance.create({
        data: {
          user_id: admin.id,
          category: cat,
          balance: 0.00
        }
      });
      console.log(`➕ Creada bolsa virtual: ${cat}`);
    }
  }

  // Limpiar datos previos de Marzo si el usuario quiere correr el seed de forma limpia
  // Para evitar colisiones en pruebas, podemos borrar transacciones de marzo
  const startDate = new Date('2026-03-01T00:00:00Z');
  const endDate = new Date('2026-03-31T23:59:59Z');

  console.log('🧹 Limpiando egresos y cierres previos del rango de fechas de Marzo...');
  await prisma.expense.deleteMany({
    where: {
      created_at: { gte: startDate, lte: endDate }
    }
  });

  await prisma.dailyClosureDetail.deleteMany({
    where: {
      closure: {
        date: { gte: startDate, lte: endDate }
      }
    }
  });

  await prisma.budgetAllocation.deleteMany({
    where: {
      closure: {
        date: { gte: startDate, lte: endDate }
      }
    }
  });

  await prisma.dailyClosure.deleteMany({
    where: {
      date: { gte: startDate, lte: endDate }
    }
  });

  console.log('✅ Base de datos limpia para Marzo de 2026.');

  // Resetear saldos de bolsas y cuentas físicas a un saldo inicial razonable de prueba (ej: 15.000.000 CLP)
  // para que los gastos se debiten sin problemas de saldo negativo inicial.
  console.log('⚖️ Configurando saldos iniciales de prueba (15.000.000 CLP)...');
  await prisma.account.update({
    where: { id: account.id },
    data: { balance: 15000000.00 }
  });

  for (const cat of requiredCategories) {
    let initialBal = 5000000.00; // 5M en cada bolsa
    await prisma.budgetBalance.update({
      where: { user_id_category: { user_id: admin.id, category: cat } },
      data: { balance: initialBal }
    });
  }

  // 2. Cargar Ingresos
  console.log(`📥 Cargando ${marzoData.ingresos.length} cierres diarios (Ingresos)...`);
  for (const ing of marzoData.ingresos) {
    const ingDate = new Date(`${ing.date}T12:00:00Z`); // Mediodía UTC para evitar desfases horários
    
    // Crear DailyClosure
    const closure = await prisma.dailyClosure.create({
      data: {
        user_id: admin.id,
        total_amount: ing.amount,
        date: ingDate
      }
    });

    // Crear DailyClosureDetail vinculando a la cuenta física
    await prisma.dailyClosureDetail.create({
      data: {
        closure_id: closure.id,
        account_id: account.id,
        amount: ing.amount
      }
    });

    // Aumentar saldo de la cuenta física
    await prisma.account.update({
      where: { id: account.id },
      data: { balance: { increment: ing.amount } }
    });

    // Distribuir a las bolsas virtuales (60/30/10)
    const allocMerch = ing.amount * 0.60;
    const allocFixed = ing.amount * 0.30;
    const allocSavings = ing.amount * 0.10;

    await prisma.budgetAllocation.createMany({
      data: [
        { closure_id: closure.id, user_id: admin.id, category: 'Mercadería', amount_allocated: allocMerch },
        { closure_id: closure.id, user_id: admin.id, category: 'Gastos Fijos', amount_allocated: allocFixed },
        { closure_id: closure.id, user_id: admin.id, category: 'Ahorro', amount_allocated: allocSavings }
      ]
    });

    // Incrementar los saldos de las bolsas virtuales
    await prisma.budgetBalance.update({
      where: { user_id_category: { user_id: admin.id, category: 'Mercadería' } },
      data: { balance: { increment: allocMerch } }
    });
    await prisma.budgetBalance.update({
      where: { user_id_category: { user_id: admin.id, category: 'Gastos Fijos' } },
      data: { balance: { increment: allocFixed } }
    });
    await prisma.budgetBalance.update({
      where: { user_id_category: { user_id: admin.id, category: 'Ahorro' } },
      data: { balance: { increment: allocSavings } }
    });
  }
  console.log('✅ Ingresos cargados correctamente.');

  // 3. Cargar Gastos (Egresos)
  console.log(`📤 Cargando ${marzoData.gastos.length} gastos...`);
  const providersCache = {};

  for (const gas of marzoData.gastos) {
    const gasDate = new Date(`${gas.date}T12:00:00Z`);

    // Buscar o crear el proveedor
    let providerId = providersCache[gas.provider];
    if (!providerId) {
      let prov = await prisma.provider.findFirst({
        where: { user_id: admin.id, name: gas.provider }
      });
      if (!prov) {
        prov = await prisma.provider.create({
          data: {
            user_id: admin.id,
            name: gas.provider,
            payment_condition: 'Contado',
            credit_days: 0,
            visible_to_employee: true
          }
        });
      }
      providerId = prov.id;
      providersCache[gas.provider] = providerId;
    }

    // Determinar categoría por defecto (ej: Mercadería)
    // Sueldos o alquileres pueden ser "Gastos Fijos"
    let budgetCategory = 'Mercadería';
    const provUpper = gas.provider.toUpperCase();
    if (provUpper.includes('SUELDO') || provUpper.includes('ALQUILER') || provUpper.includes('SERVICIOS') || provUpper.includes('PATENTE') || provUpper.includes('LENTILLAS') || provUpper.includes('NÓMINA')) {
      budgetCategory = 'Gastos Fijos';
    }

    // Crear Expense con status "Pagado"
    await prisma.expense.create({
      data: {
        user_id: admin.id,
        provider_id: providerId,
        account_id: account.id,
        budget_category: budgetCategory,
        amount: gas.amount,
        status: 'Pagado',
        paid_at: gasDate,
        due_date: gasDate,
        created_at: gasDate
      }
    });

    // Descontar saldo de la cuenta física
    await prisma.account.update({
      where: { id: account.id },
      data: { balance: { decrement: gas.amount } }
    });

    // Descontar saldo de la bolsa virtual
    await prisma.budgetBalance.update({
      where: { user_id_category: { user_id: admin.id, category: budgetCategory } },
      data: { balance: { decrement: gas.amount } }
    });
  }

  console.log('✅ Gastos cargados correctamente.');
  console.log('🎉 Carga de datos de Marzo finalizada con éxito.');
}

main()
  .catch((e) => {
    console.error('❌ Error cargando el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
