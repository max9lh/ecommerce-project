const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const errorHandler = require('./middlewares/errorHandler');
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
const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Sistema de finanzas activo' });
});

// Rutas
app.use('/api/auth', authRouter);
app.use('/api/closures', closureRouter);
app.use('/api/providers', providerRouter);
app.use('/api/expenses', expenseRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/projection', projectionRouter);
app.use('/api/recurring-expenses', recurringExpenseRouter);
app.use('/api/payroll', payrollRouter);

// Error handler global (siempre al final)
app.use(errorHandler);
module.exports = app;