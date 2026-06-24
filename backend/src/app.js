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
    'http://localhost:3000'
];

// Agregar el origen de producción si está definido en las variables de entorno
if (process.env.CORS_ORIGIN) {
    allowedOrigins.push(process.env.CORS_ORIGIN);
}

const corsOptions = {
    origin: function (origin, callback) {
        // En desarrollo o si es uno de los orígenes permitidos explícitamente, o si no hay origen (postman, etc)
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    maxAge: 86400
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