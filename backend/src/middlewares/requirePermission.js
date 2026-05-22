/**
 * requirePermission — Factory de middlewares de autorización granular
 *
 * Genera un middleware que verifica si el usuario autenticado
 * tiene activo el permiso solicitado en su EmployeePermission.
 *
 * Reglas:
 *  - Si el usuario es ADMIN, siempre pasa (tiene todos los permisos).
 *  - Si el usuario es EMPLOYEE, se verifica el campo booleano
 *    correspondiente en req.user.permissions (payload del JWT).
 *  - Si no tiene el permiso, responde 403 Forbidden.
 *
 * Requiere que authGuard haya corrido antes.
 *
 * Uso en rutas:
 *   router.post('/closures', authGuard, requirePermission('canRegisterClosures'), controller.create);
 *   router.post('/expenses', authGuard, requirePermission('canRegisterExpenses'), controller.create);
 *
 * @param {string} permission - Nombre del campo en EmployeePermission
 */
const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            const error = new Error('No autorizado');
            error.statusCode = 401;
            return next(error);
        }

        if (req.user.role === 'ADMIN') {
            return next();
        }

        const hasPermission = req.user.permissions && req.user.permissions[permission] === true;

        if (!hasPermission) {
            const error = new Error(`Acceso denegado: no tenés el permiso "${permission}"`);
            error.statusCode = 403;
            return next(error);
        }

        next();
    };
};

module.exports = requirePermission;
