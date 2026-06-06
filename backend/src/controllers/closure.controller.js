const closureService = require('../services/closure.service');

const createClosure = async (req, res, next) => {
    try{
        const dailyClosure = await closureService.createClosure({ user_id: req.user.id, ...req.body });
        res.status(201).json({
            status: 'success',
            message: 'Caja diaria guardada correctamente',
            data: dailyClosure,
        });
    } catch(error){
        next(error);
    }
}

const getClosures = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const closures = await closureService.getClosures(page, limit);
        res.status(200).json(closures);
    } catch (error) {
        next(error);
    }
}

const getClosureById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const closure = await closureService.getClosureById(id);
        if (!closure) {
            return res.status(404).json({ message: 'Cierre de caja no encontrado' });
        }
        res.status(200).json({ data: closure });
    } catch (error) {
        next(error);
    }
}

const updateClosure = async (req, res, next) => {
    try {
        const { id } = req.params;
        const dailyClosure = await closureService.updateClosure(id, { user_id: req.user.id, ...req.body });
        res.status(200).json({
            status: 'success',
            message: 'Cierre de caja modificado correctamente',
            data: dailyClosure,
        });
    } catch (error) {
        next(error);
    }
}

module.exports = { createClosure, getClosures, getClosureById, updateClosure };