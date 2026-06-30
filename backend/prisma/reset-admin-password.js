require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Buscando al usuario Administrador...');
    
    // Buscar al primer administrador activo
    const admin = await prisma.user.findFirst({
        where: { role: 'ADMIN', deleted_at: null }
    });

    if (!admin) {
        console.error('❌ No se encontró ningún Administrador activo en la base de datos.');
        process.exit(1);
    }

    // Contraseña temporal
    const TEMP_PASS = 'admin123';

    console.log(`🔐 Generando nueva contraseña temporal...`);
    const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const password_hash = await bcrypt.hash(TEMP_PASS, BCRYPT_ROUNDS);

    // Actualizamos al admin: nueva contraseña, invalidamos sesiones y forzamos cambio de clave
    await prisma.user.update({
        where: { id: admin.id },
        data: {
            password_hash,
            must_change_password: true,
            refresh_token_hash: null
        }
    });

    console.log('\n✅ ¡Contraseña del administrador restablecida con éxito!');
    console.log('----------------------------------------------------');
    console.log(`👤 Usuario Administrador: ${admin.username}`);
    console.log(`🔑 Nueva contraseña temporal: ${TEMP_PASS}`);
    console.log('⚠️  El sistema pedirá cambiar la contraseña obligatoriamente en el próximo inicio de sesión.');
    console.log('----------------------------------------------------\n');
}

main()
    .catch((e) => {
        console.error('❌ Error al restablecer la contraseña:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
