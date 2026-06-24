const adminService = require('../services/admin.service');
const passwordResetService = require('../services/passwordReset.service');

const createEmployee = async (req, res, next) => {
    try {
        const employee = await adminService.createEmployee(req.body);
        res.status(201).json({ success: true, data: employee });
    } catch (error) {
        next(error);
    }
};

const getEmployees = async (req, res, next) => {
    try {
        const employees = await adminService.getEmployees();
        res.status(200).json({ success: true, data: employees });
    } catch (error) {
        next(error);
    }
};

const updateEmployeePermissions = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updatedPermissions = await adminService.updateEmployeePermissions(Number(id), req.body);
        res.status(200).json({ success: true, data: updatedPermissions });
    } catch (error) {
        next(error);
    }
};

const updateEmployeeProfile = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updatedProfile = await adminService.updateEmployeeProfile(Number(id), req.body);
        res.status(200).json({ success: true, data: updatedProfile });
    } catch (error) {
        next(error);
    }
};

const deleteEmployee = async (req, res, next) => {
    try {
        const { id } = req.params;
        await adminService.deleteEmployee(Number(id));
        res.status(200).json({ success: true, message: 'Empleado eliminado correctamente' });
    } catch (error) {
        next(error);
    }
};

const getDistribution = async (req, res, next) => {
    try {
        const settings = await adminService.getDistributionSettings(req.user.id);
        res.status(200).json({ success: true, data: settings });
    } catch (error) {
        next(error);
    }
};

const updateDistribution = async (req, res, next) => {
    try {
        const settings = await adminService.updateDistributionSettings(req.user.id, req.body);
        res.status(200).json({ success: true, data: settings, message: 'Distribución de ingresos actualizada correctamente' });
    } catch (error) {
        next(error);
    }
};

const getAuditLogs = async (req, res, next) => {
    try {
        const page = req.query.page ? parseInt(req.query.page, 10) : null;
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : null;

        const result = await adminService.getAuditLogs(page, limit);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const generateEmployeeResetLink = async (req, res, next) => {
    try {
        const { id } = req.params;
        const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
        
        const resetUrl = await passwordResetService.generateAdminResetLink(Number(id), frontendUrl);
        
        res.status(200).json({
            success: true,
            message: 'Enlace de recuperación generado correctamente',
            data: { resetUrl }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createEmployee,
    getEmployees,
    updateEmployeePermissions,
    updateEmployeeProfile,
    deleteEmployee,
    getDistribution,
    updateDistribution,
    getAuditLogs,
    generateEmployeeResetLink
};