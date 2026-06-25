// backend/src/server.js
require('dotenv').config();
const validateEnv = require('./config/validate-env');
const logger = require('./config/logger');
const { scheduleAuditCleanup } = require('./utils/auditCleanup');

// Validar variables de entorno ANTES de cargar la app
const env = validateEnv();

const app = require('./app');
const prisma = require('./config/db');

const PORT = process.env.PORT || 3000;

async function main() {
    try {
        // Verificar conexión a BD con timeout
        logger.info('🔄 Intentando conectar a PostgreSQL...');
        
        // Usar generateClient en lugar de $connect para evitar migraciones
        await prisma.$queryRaw`SELECT 1`;
        logger.info('✅ Conexión exitosa a PostgreSQL con Prisma');

        // Iniciar servidor
        const server = app.listen(PORT, () => {
            logger.info(`🚀 Servidor corriendo en http://localhost:${PORT}`);
            logger.info(`📍 Entorno: ${process.env.NODE_ENV}`);
        });

        // Programar limpieza periódica de AuditLog (cada 7 días, retención 90 días)
        scheduleAuditCleanup();

        // Graceful shutdown
        process.on('SIGTERM', async () => {
            logger.info('SIGTERM recibido, iniciando shutdown graceful...');
            server.close(async () => {
                await prisma.$disconnect();
                logger.info('Servidor cerrado correctamente');
                process.exit(0);
            });
        });

        process.on('SIGINT', async () => {
            logger.info('SIGINT recibido, iniciando shutdown graceful...');
            server.close(async () => {
                await prisma.$disconnect();
                logger.info('Servidor cerrado correctamente');
                process.exit(0);
            });
        });

    } catch (error) {
        logger.error('❌ Error al iniciar el sistema:', error.message);
        await prisma.$disconnect();
        process.exit(1);
    }
}

main();
