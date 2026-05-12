// Middleware de errores global de Express.
const errorHandler = (err, req, res, next) => {
    console.error(`[ERROR] ${err.message}`);

    const statusCode = err.statusCode || err.status || 500;

    const response = {
        status: 'error',
        message: err.message || 'Error interno del servidor',
    };

    // En desarrollo, incluir el stack trace para facilitar el debugging
    if (process.env.NODE_ENV !== 'production') {
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
};

module.exports = errorHandler;