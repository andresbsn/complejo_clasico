const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'secreto_super_seguro';

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    console.log(`[Middleware] ${req.method} ${req.path}`, { authHeader });
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        console.log('[Middleware] No token provided');
        return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Token inválido o expirado.' });
    }
};

module.exports = authMiddleware;
