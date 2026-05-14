const authService = require('../services/auth.service');

const register = async (req, res, next) => {
    try {
        const user = await authService.register(req.body);
        res.status(201).json({
            status: 'success',
            message: 'Usuario registrado correctamente',
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const user = await authService.login(req.body);
        res.status(200).json({
            status: 'success',
            message: 'Login exitoso',
            data: user,
        })
    } catch (error) {
        next(error);
    }
};

const updatePercentages = async (req, res, next) => {
    try {
        const user = await authService.updatePercentages({ userId: req.user.id, ...req.body });
        res.status(200).json({
            status: 'success',
            message: 'Porcentajes actualizados',
            data: user,
        })
    } catch (error) {
        next(error);
    }
};

module.exports = { register, login, updatePercentages };
