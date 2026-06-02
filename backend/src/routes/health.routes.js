// backend/src/routes/health.routes.js
const express = require('express');
const prisma = require('../config/db');
const logger = require('../config/logger');

const router = express.Router();

/**
 * GET /health
 * Verificación básica del servidor
 */
router.get('/', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Sistema de finanzas activo',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

/**
 * GET /ready
 * Verificación de que el sistema está listo (BD conectada, etc)
 * Útil para Kubernetes/Docker health checks
 */
router.get('/ready', async (req, res) => {
    try {
        // Probar conexión a BD
        await prisma.$queryRaw`SELECT 1`;

        res.status(200).json({
            ready: true,
            timestamp: new Date().toISOString(),
            database: 'connected'
        });
    } catch (error) {
        logger.error('Readiness check failed', { error: error.message });
        res.status(503).json({
            ready: false,
            timestamp: new Date().toISOString(),
            database: 'disconnected'
        });
    }
});

/**
 * GET /alive
 * Verificación de que el proceso está vivo (liveness probe)
 */
router.get('/alive', (req, res) => {
    res.status(200).json({
        alive: true,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

module.exports = router;