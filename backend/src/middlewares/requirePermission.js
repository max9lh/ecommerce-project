const prisma = require('../config/db');
const { ROLES } = require('../utils/constants');

/**
 * requirePermission — Factory de middlewares de autorización granular flexible
 *
 * Ahora soporta múltiples permisos (lógica OR). Si el empleado tiene al menos
 * uno de los permisos provistos, se le concede el acceso.
 *
 * Ejemplos de uso:
 *  - requirePermission('canRegisterClosures') -> Requiere obligatoriamente ese permiso.
 *  - requirePermission('canRegisterExpenses', 'canPayExpenses') -> Pasa si tiene cualquiera de los dos.
 *
 * @param {...string} permissions - Uno o más campos de EmployeePermission
 */
const requirePermission = (...permissions) => {
    return async (req, res, next) => {
        if (!req.user) {
            const error = new Error('No autorizado');
            error.statusCode = 401;
            return next(error);
        }

        // El administrador del local siempre tiene acceso irrestricto
        if (req.user.role === ROLES.ADMIN) {
            return next();
        }

        try {
            const permissionsRecord = await prisma.employeePermission.findUnique({
                where: { user_id: req.user.id }
            });

            if (!permissionsRecord) {
                const error = new Error('Permisos de empleado no encontrados');
                error.statusCode = 403;
                return next(error);
            }

            // Verificamos si al menos uno de los permisos requeridos está en true
            const hasRequiredPermission = permissions.some(
                (perm) => permissionsRecord[perm] === true
            );

            if (!hasRequiredPermission) {
                const listPerms = permissions.join(' o ');
                const error = new Error(`Acceso denegado: requieres el permiso de "${listPerms}"`);
                error.statusCode = 403;
                return next(error);
            }

            // Autorización concedida
            next();
        } catch (error) {
            next(error);
        }
    };
};

module.exports = requirePermission;