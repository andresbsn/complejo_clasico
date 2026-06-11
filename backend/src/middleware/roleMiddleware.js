module.exports.ensureAdmin = (req, res, next) => {
    try {
        if (!req.user || req.user.rol !== 'admin') {
            return res.status(403).json({ error: 'Solo administradores pueden realizar esta acción.' });
        }
        next();
    } catch (e) {
        return res.status(403).json({ error: 'Acceso no autorizado.' });
    }
};
