const prisma = require('../config/db');
const bcrypt = require('bcrypt');

const createEmployee = async (employeeData) => {
    const { username, first_name, last_name, password, hourly_rate, salary_type, monthly_salary } = employeeData;

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
        const error = new Error('El empleado ya se encuentra registrado');
        error.statusCode = 400;
        throw error;
    }

    const password_hash = await bcrypt.hash(password, 10);

    return await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
            data: {
                username,
                password_hash,
                role: 'EMPLOYEE'
            },
            select: { id: true, username: true, role: true, created_at: true }
        });

        await tx.employeeProfile.create({
            data: {
                user_id: newUser.id,
                hourly_rate,
                first_name,
                last_name,
                salary_type,
                monthly_salary: salary_type === 'fixed' ? monthly_salary : null
            }
        });

        await tx.employeePermission.create({
            data: {
                user_id: newUser.id
            }
        });

        return newUser;
    });
};

const getEmployees = async () => {
    return await prisma.user.findMany({
        where: { role: 'EMPLOYEE' },
        select: {
            id: true,
            username: true,
            role: true,
            created_at: true,
            employeeProfile: true,
            employeePermission: true
        }
    });
};


const updateEmployeePermissions = async (userId, permissionsData) => {
    const permissionExists = await prisma.employeePermission.findUnique({ where: { user_id: userId } });
    if (!permissionExists) {
        const error = new Error('Permisos no encontrados para este usuario');
        error.statusCode = 404;
        throw error;
    }

    return await prisma.employeePermission.update({
        where: { user_id: userId },
        data: {
            canRegisterClosures: permissionsData.canRegisterClosures,
            canRegisterExpenses: permissionsData.canRegisterExpenses,
            canPayExpenses: permissionsData.canPayExpenses,
            canManageProviders: permissionsData.canManageProviders
        }
    });
};

const updateEmployeeProfile = async (userId, profileData) => {
    const profileExists = await prisma.employeeProfile.findUnique({ where: { user_id: userId } });
    if (!profileExists) {
        const error = new Error('Perfil de empleado no encontrado');
        error.statusCode = 404;
        throw error;
    }

    return await prisma.employeeProfile.update({
        where: { user_id: userId },
        data: {
            hourly_rate: profileData.hourly_rate,
            salary_type: profileData.salary_type,
            monthly_salary: profileData.salary_type === 'fixed' ? profileData.monthly_salary : null
        }
    });
};

const deleteEmployee = async (id) => {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.role === 'ADMIN') {
        const error = new Error('Empleado no encontrado');
        error.statusCode = 404;
        throw error;
    }

    return await prisma.user.delete({ where: { id } });
};

module.exports = {
    createEmployee,
    getEmployees,
    updateEmployeePermissions,
    updateEmployeeProfile,
    deleteEmployee
};