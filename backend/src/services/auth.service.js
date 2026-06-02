const bcrypt = require('bcrypt');
const prisma = require('../config/db');
const jwt = require('jsonwebtoken');

const register = async (userData) => {
    const { username, password, role } = userData;

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
        const error = new Error('El nombre de usuario ya está en uso');
        error.statusCode = 409;
        throw error;
    }

    const userRole = role === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE';
    const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    return await prisma.$transaction(async (tx) => {

        const user = await tx.user.create({
            data: {
                username,
                password_hash,
                role: userRole,
                pct_merchandise: userRole === 'ADMIN' ? (userData.pct_merchandise || 0.60) : 0.00,
                pct_fixed_expenses: userRole === 'ADMIN' ? (userData.pct_fixed_expenses || 0.30) : 0.00,
                pct_savings: userRole === 'ADMIN' ? (userData.pct_savings || 0.10) : 0.00,
            },
            select: {
                id: true,
                username: true,
                role: true,
                pct_merchandise: true,
                pct_fixed_expenses: true,
                pct_savings: true,
                created_at: true,
            },
        });

        if (userRole === 'ADMIN') {
            await tx.account.createMany({
                data: [
                    { user_id: user.id, name: 'Efectivo', balance: 0.00 },
                    { user_id: user.id, name: 'Cuenta Bancaria', balance: 0.00 }
                ]
            });

            await tx.budgetBalance.createMany({
                data: [
                    { user_id: user.id, category: 'Mercadería', balance: 0.00 },
                    { user_id: user.id, category: 'Gastos Fijos', balance: 0.00 },
                    { user_id: user.id, category: 'Ahorro', balance: 0.00 }
                ]
            });
        }

        else {
            await tx.employeeProfile.create({
                data: {
                    user_id: user.id,
                    first_name: userData.first_name,
                    last_name: userData.last_name,
                    salary_type: userData.salary_type || "hourly",
                    hourly_rate: userData.hourly_rate ? parseFloat(userData.hourly_rate) : 0.00,
                    monthly_salary: userData.monthly_salary ? parseFloat(userData.monthly_salary) : null
                }
            });

            await tx.employeePermission.create({
                data: {
                    user_id: user.id,
                    canRegisterClosures: true,
                    canRegisterExpenses: true,
                    canPayExpenses: false,
                    canManageProviders: false
                }
            });
        }
        return user;
    });
};

const login = async ({ username, password }) => {
    const user = await prisma.user.findUnique({
        where: { username },
        include: { employeePermission: true }
    });
    if (!user || user.deleted_at !== null) {
        const error = new Error('Credenciales incorrectas');
        error.statusCode = 401;
        throw error;
    }
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
        const error = new Error('Credenciales incorrectas');
        error.statusCode = 401;
        throw error;
    }

    const payload = {
        id: user.id,
        username: user.username,
        role: user.role,
    };

    if (user.role === 'EMPLOYEE') {
        const permissions = await prisma.employeePermission.findUnique({
            where: { user_id: user.id },
            select: {
                canRegisterClosures: true,
                canRegisterExpenses: true,
                canPayExpenses: true,
                canManageProviders: true
            }
        });
        payload.permissions = permissions;
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m'; // Short lived access token
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    const REFRESH_SECRET = process.env.REFRESH_SECRET || (JWT_SECRET + "_refresh");
    const refresh_token = jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: '7d' });

    await prisma.user.update({
        where: { id: user.id },
        data: { refresh_token }
    });

    return {
        user: {
            id: user.id,
            username: user.username,
            role: user.role,
        },
        token,
        refresh_token,
    };
}

const refreshTokens = async (refreshTokenStr) => {
    if (!refreshTokenStr) {
        const error = new Error('Refresh token requerido');
        error.statusCode = 401;
        throw error;
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    const REFRESH_SECRET = process.env.REFRESH_SECRET || (JWT_SECRET + "_refresh");
    let decoded;
    try {
        decoded = jwt.verify(refreshTokenStr, REFRESH_SECRET);
    } catch (err) {
        const error = new Error('Refresh token inválido o expirado');
        error.statusCode = 401;
        throw error;
    }

    const user = await prisma.user.findFirst({
        where: { id: decoded.id, refresh_token: refreshTokenStr, deleted_at: null },
        include: { employeePermission: true }
    });

    if (!user) {
        const error = new Error('Refresh token revocado o usuario inválido');
        error.statusCode = 401;
        throw error;
    }

    const payload = {
        id: user.id,
        username: user.username,
        role: user.role,
    };

    if (user.role === 'EMPLOYEE' && user.employeePermission) {
        payload.permissions = {
            canRegisterClosures: user.employeePermission.canRegisterClosures,
            canRegisterExpenses: user.employeePermission.canRegisterExpenses,
            canPayExpenses: user.employeePermission.canPayExpenses,
            canManageProviders: user.employeePermission.canManageProviders
        };
    }

    const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
    const newToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const newRefreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: '7d' });

    await prisma.user.update({
        where: { id: user.id },
        data: { refresh_token: newRefreshToken }
    });

    return {
        token: newToken,
        refresh_token: newRefreshToken
    };
}

const updatePercentages = async ({ userId, pct_merchandise, pct_fixed_expenses, pct_savings }) => {
    const total = parseFloat(pct_merchandise) + parseFloat(pct_fixed_expenses) + parseFloat(pct_savings);

    if (Math.abs(total - 1.0) > 0.01) { // Permite 1% de error de redondeo
        const error = new Error(`Los porcentajes deben sumar 100% (actual: ${(total * 100).toFixed(2)}%)`);
        error.statusCode = 400;
        throw error;
    }

    if (pct_merchandise < 0 || pct_fixed_expenses < 0 || pct_savings < 0) {
        const error = new Error('Los porcentajes no pueden ser negativos');
        error.statusCode = 400;
        throw error;
    }

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { pct_merchandise, pct_fixed_expenses, pct_savings },
        select: {
            id: true,
            pct_merchandise: true,
            pct_fixed_expenses: true,
            pct_savings: true,
        },
    });

    return updatedUser;
}

module.exports = { register, login, refreshTokens, updatePercentages };