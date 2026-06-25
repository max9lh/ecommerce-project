const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const logger = require('./config/logger');
const errorHandler = require('./middlewares/errorHandler');
const { apiLimiter, authLimiter, writeLimiter } = require('./middlewares/rateLimiter');

const authRouter = require('./routes/auth.routes');
const closureRouter = require('./routes/closure.routes');
const providerRouter = require('./routes/providers.routes');
const expenseRouter = require('./routes/expense.routes');
const accountsRouter = require('./routes/accounts.routes');
const adminRouter = require('./routes/admin.routes');
const attendanceRouter = require('./routes/attendance.routes');
const dashboardRouter = require('./routes/dashboard.routes');
const reportsRouter = require('./routes/reports.routes');
const projectionRouter = require('./routes/projection.routes');
const recurringExpenseRouter = require('./routes/recurringExpense.routes');
const payrollRouter = require('./routes/payroll.routes');
const healthRouter = require('./routes/health.routes');

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

// ============================================================
// MIDDLEWARES DE SEGURIDAD
// ============================================================

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://localhost',
    'https://localhost'
];

// Procesamos la variable de entorno de forma segura para producción
if (process.env.CORS_ORIGIN) {
    // Soportamos que pongas una o más URLs separadas por comas, limpiando espacios y barras '/' al final
    const origins = process.env.CORS_ORIGIN.split(',')
        .map(url => url.trim().replace(/\/$/, ''))
        .filter(Boolean); // Elimina elementos vacíos si quedó una coma colgada
    allowedOrigins.push(...origins);
}

// Variable para evitar spam de logs
let corsRejectionCount = 0;
let lastCorsLogTime = Date.now();

const corsOptions = {
    origin: function (origin, callback) {
        // 1. Si no hay origen (peticiones Server-to-Server, Postman, Curl, o Health Checks), se permite.
        if (!origin) {
            return callback(null, true);
        }

        // 2. Limpiamos el origen que manda el navegador (quitando barras finales por seguridad)
        const cleanOrigin = origin.trim().replace(/\/$/, '');

        // 3. Validación estricta contra la lista blanca
        if (allowedOrigins.includes(cleanOrigin)) {
            return callback(null, true);
        }
        
        // 4. Log moderado para no saturar los logs en producción (máximo 1 log cada 5 minutos)
        const now = Date.now();
        if (now - lastCorsLogTime > 300000) { // 5 minutos
            logger.warn(`[CORS] ${corsRejectionCount} solicitudes rechazadas en los últimos 5 minutos. Último origen rechazado: "${origin}"`);
            corsRejectionCount = 0;
            lastCorsLogTime = now;
        } else {
            corsRejectionCount++;
        }
        
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true, // Requerido para el manejo seguro de cookies y sesiones
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    maxAge: 86400 // Cachea el resultado exitoso por 24 horas en el navegador para optimizar la velocidad
};

app.use(cors(corsOptions));
app.use(morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"'));

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ limit: '100kb', extended: true }));
app.use(cookieParser());

// ============================================================
// HEALTH CHECK (Sin rate limiting)
// ============================================================
app.use('/api/health', healthRouter);

// ============================================================
// RATE LIMITING
// ============================================================
app.use('/api/', apiLimiter);

// ============================================================
// RUTAS PROTEGIDAS
// ============================================================
app.use('/api/auth', authRouter);
app.use('/api/closures', writeLimiter, closureRouter);
app.use('/api/providers', writeLimiter, providerRouter);
app.use('/api/expenses', writeLimiter, expenseRouter);
app.use('/api/accounts', writeLimiter, accountsRouter);
app.use('/api/admin', writeLimiter, adminRouter);
app.use('/api/attendance', writeLimiter, attendanceRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/projection', projectionRouter);
app.use('/api/recurring-expenses', writeLimiter, recurringExpenseRouter);
app.use('/api/payroll', payrollRouter);

// ============================================================
// MANEJO DE ERRORES
// ============================================================
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Ruta no encontrada',
        path: req.originalUrl,
        timestamp: new Date().toISOString()
    });
});

app.use(errorHandler);

module.exports = app;