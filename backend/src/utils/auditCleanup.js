// backend/src/utils/auditCleanup.js
// ============================================================
// Limpieza periódica de registros de auditoría
// Elimina registros con más de RETENTION_DAYS días de antigüedad
// ============================================================
// Uso manual:   node src/utils/auditCleanup.js
// Uso en cron:  se registra automáticamente al iniciar el servidor
// ============================================================

const prisma = require('../config/db');
const logger = require('../config/logger');

const RETENTION_DAYS = 90; // Mantener 90 días de historial

/**
 * Elimina registros de AuditLog anteriores a la fecha de corte.
 * Diseñado para ejecutarse como job periódico (semanal/mensual).
 */
async function cleanOldAuditLogs() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

    try {
        const result = await prisma.auditLog.deleteMany({
            where: { created_at: { lt: cutoff } }
        });

        logger.info(`🧹 AuditLog cleanup: ${result.count} registros eliminados (anteriores a ${cutoff.toISOString().split('T')[0]})`);
        return result.count;
    } catch (error) {
        logger.error(`❌ Error en limpieza de AuditLog: ${error.message}`);
        throw error;
    }
}

/**
 * Programa la ejecución periódica del cleanup.
 * Se ejecuta cada 7 días (una semana).
 * Llamar una vez al iniciar el servidor.
 */
function scheduleAuditCleanup() {
    const INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

    // Ejecutar la primera limpieza 30 segundos después de iniciar
    // para no bloquear el arranque del servidor
    setTimeout(() => {
        cleanOldAuditLogs().catch(() => {});
    }, 30 * 1000);

    // Programar ejecuciones periódicas
    const interval = setInterval(() => {
        cleanOldAuditLogs().catch(() => {});
    }, INTERVAL_MS);

    // No bloquear el cierre del proceso Node
    interval.unref();

    logger.info(`📅 Limpieza de AuditLog programada cada 7 días (retención: ${RETENTION_DAYS} días)`);
}

// Si se ejecuta directamente: node src/utils/auditCleanup.js
if (require.main === module) {
    require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
    cleanOldAuditLogs()
        .then((count) => {
            console.log(`✅ Limpieza completada: ${count} registros eliminados`);
            process.exit(0);
        })
        .catch((err) => {
            console.error(`❌ Error: ${err.message}`);
            process.exit(1);
        });
}

module.exports = { cleanOldAuditLogs, scheduleAuditCleanup };
