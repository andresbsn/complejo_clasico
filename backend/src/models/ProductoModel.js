const pool = require('../config/db');

const ProductoModel = {
    // Obtener todos los productos
    async getAll(filters = {}) {
        // Includes join with proveedores for convenience
        let query = `
            SELECT p.*, pr.nombre as proveedor_nombre 
            FROM productos p
            LEFT JOIN proveedores pr ON p.proveedor_id = pr.id
        `;

        const conditions = [];
        const values = [];

        // Filter by estado if specified
        if (filters.estado) {
            conditions.push(`p.estado = $${values.length + 1}`);
            values.push(filters.estado);
        }

        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(' AND ')}`;
        }

        query += ` ORDER BY p.nombre ASC`;

        const result = await pool.query(query, values);
        return result.rows;
    },

    // Obtener un producto por ID
    async getById(id) {
        const query = 'SELECT * FROM productos WHERE id = $1';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    },

    // Crear un nuevo producto
    async create(data) {
        const {
            nombre, categoria, precio, stock,
            stock_minimo = 0, precio_venta, costo = 0,
            proveedor_id, estado = 'ACTIVO'
        } = data;

        // Default precio_venta to precio if not provided, or vice versa
        const finalPrecio = precio || precio_venta;

        const query = `
            INSERT INTO productos (nombre, categoria, precio, stock, stock_minimo, precio_venta, costo, proveedor_id, estado)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `;
        const result = await pool.query(query, [
            nombre, categoria, finalPrecio, stock,
            stock_minimo, finalPrecio, costo, proveedor_id, estado
        ]);
        return result.rows[0];
    },

    // Actualizar un producto
    async update(id, data) {
        const {
            nombre, categoria, precio, stock,
            stock_minimo, precio_venta, costo,
            proveedor_id, estado
        } = data;

        const finalPrecio = precio || precio_venta;

        const query = `
            UPDATE productos
            SET nombre = $1, categoria = $2, precio = $3, stock = $4,
                stock_minimo = $5, precio_venta = $6, costo = $7,
                proveedor_id = $8, estado = $9
            WHERE id = $10
            RETURNING *
        `;
        const result = await pool.query(query, [
            nombre, categoria, finalPrecio, stock,
            stock_minimo, finalPrecio, costo,
            proveedor_id, estado, id
        ]);
        return result.rows[0];
    },

    // Eliminar un producto
    async delete(id) {
        const query = 'DELETE FROM productos WHERE id = $1 RETURNING *';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }
};

module.exports = ProductoModel;
