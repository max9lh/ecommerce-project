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
        const closures = await closureService.getClosures();
        res.status(200).json({ data: closures });
    } catch (error) {
        next(error);
    }
}

module.exports = { createClosure, getClosures };