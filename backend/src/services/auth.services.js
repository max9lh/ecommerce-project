const bcrypt = require('bcrypt');
const prisma = require('../config/db');
const jwt = require('jsonwebtoken');

const register = async ({ username, password, pct_merchandise, pct_fixed_expenses, pct_savings }) => {
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
        const error = new Error('El nombre de usuario ya está en uso');
        error.statusCode = 409;
        throw error;
    }

    const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
        data: {
            username,
            password_hash,
            pct_merchandise,
            pct_fixed_expenses,
            pct_savings,
        },
        select: {
            id: true,
            username: true,
            pct_merchandise: true,
            pct_fixed_expenses: true,
            pct_savings: true,
            created_at: true,
        },
    });

    return user;
};

const login = async ({ username, password }) => {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
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
    };
    const JWT_SECRET = process.env.JWT_SECRET;
    const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return {
        user: {
            id: user.id,
            username: user.username,
        },
        token,
    };
}

const updatePercentages = async ({ userId, pct_merchandise, pct_fixed_expenses, pct_savings }) => {
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

module.exports = { register, login, updatePercentages };