const UserModel = require('../models/UserModel');
const bcrypt = require('bcryptjs');

const userController = {
    getUsers: async (req, res) => {
        try {
            const users = await UserModel.getAll();
            res.json(users);
        } catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).json({ error: 'Error al obtener usuarios' });
        }
    },

    createUser: async (req, res) => {
        try {
            const { username, password, nombre, rol } = req.body;

            if (!username || !password || !nombre) {
                return res.status(400).json({ error: 'Todos los campos son obligatorios' });
            }

            // Check if user exists
            const existingUser = await UserModel.findByUsername(username);
            if (existingUser) {
                return res.status(400).json({ error: 'El nombre de usuario ya existe' });
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const newUser = await UserModel.create({
                username,
                password: hashedPassword,
                nombre,
                rol
            });

            res.status(201).json(newUser);
        } catch (error) {
            console.error('Error creating user:', error);
            res.status(500).json({ error: 'Error al crear usuario' });
        }
    },

    deleteUser: async (req, res) => {
        try {
            const { id } = req.params;
            const deletedUser = await UserModel.delete(id);

            if (!deletedUser) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }

            res.json({ message: 'Usuario eliminado correctamente' });
        } catch (error) {
            console.error('Error deleting user:', error);
            res.status(500).json({ error: 'Error al eliminar usuario' });
        }
    }
};

module.exports = userController;
