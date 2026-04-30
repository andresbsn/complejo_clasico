const UserModel = require('../models/UserModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'secreto_super_seguro';

const authController = {
    login: async (req, res) => {
        try {
            const { username, password } = req.body;

            // 1. Check if user exists
            const user = await UserModel.findByUsername(username);
            if (!user) {
                return res.status(401).json({ error: 'Credenciales inválidas' });
            }

            // 2. Check password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ error: 'Credenciales inválidas' });
            }

            // 3. Generate Token
            const token = jwt.sign(
                { id: user.id, username: user.username, rol: user.rol },
                SECRET_KEY,
                { expiresIn: '8h' }
            );

            res.json({
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    nombre: user.nombre,
                    rol: user.rol
                }
            });

        } catch (error) {
            console.error('Error en login:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
};

module.exports = authController;
