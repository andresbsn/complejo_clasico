const pool = require('../config/db');

const CategoriaModel = {
    async getAll() {
        const query = 'SELECT * FROM categorias ORDER BY id ASC';
        const result = await pool.query(query);
        return result.rows;
    }
};

module.exports = CategoriaModel;
