const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');

// Configuración optimizada para Railway
const prisma = new PrismaClient({
    log: ['error', 'warn'],
    errorFormat: 'pretty',
});

// Manejo de desconexiones
prisma.$on('error', (error) => {
    logger.error('❌ Error en Prisma:', error.message);
});

prisma.$on('disconnect', () => {
    logger.warn('⚠️ Desconexión de PostgreSQL');
});

prisma.$on('connect', () => {
    logger.info('✅ Conexión establecida con PostgreSQL');
});

module.exports = prisma;
