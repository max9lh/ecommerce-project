const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const errorHandler = require('./middlewares/errorHandler');
const authRouter = require('./routes/auth.routes');
const closureRouter = require('./routes/closure.routes');
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

// Error handler global (siempre al final)
app.use(errorHandler);
module.exports = app;