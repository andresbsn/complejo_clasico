const pool = require('../config/db');

const ProveedorModel = {
    getAll: async () => {
        // Includes balance calculation: Total DEBE (Deuda Generada) - Total HABER (Pagos Realizados)
        // If positive, we owe them.
        const query = `
            SELECT p.*, 
            COALESCE(SUM(CASE WHEN m.tipo = 'DEBE' THEN m.monto ELSE 0 END), 0) - 
            COALESCE(SUM(CASE WHEN m.tipo = 'HABER' THEN m.monto ELSE 0 END), 0) as saldo
            FROM proveedores p
            LEFT JOIN movimientos_proveedor m ON p.id = m.proveedor_id
            GROUP BY p.id
            ORDER BY p.nombre ASC
        `;
        const result = await pool.query(query);
        return result.rows;
    },

    create: async (data) => {
        const { nombre, contacto, telefono, email } = data;
        const query = `
            INSERT INTO proveedores (nombre, contacto, telefono, email)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const result = await pool.query(query, [nombre, contacto, telefono, email]);
        return result.rows[0];
    },

    update: async (id, data) => {
        const { nombre, contacto, telefono, email } = data;
        const query = `
            UPDATE proveedores
            SET nombre = $1, contacto = $2, telefono = $3, email = $4
            WHERE id = $5
            RETURNING *
        `;
        const result = await pool.query(query, [nombre, contacto, telefono, email, id]);
        return result.rows[0];
    },

    delete: async (id) => {
        const query = 'DELETE FROM proveedores WHERE id = $1 RETURNING *';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    },

    getMovimientos: async (proveedorId) => {
        const query = `
            SELECT * FROM movimientos_proveedor 
            WHERE proveedor_id = $1 
            ORDER BY fecha DESC
        `;
        const result = await pool.query(query, [proveedorId]);
        return result.rows;
    },

    addMovimiento: async (data) => {
        const { proveedor_id, tipo, monto, descripcion } = data;
        const query = `
            INSERT INTO movimientos_proveedor (proveedor_id, tipo, monto, descripcion)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const result = await pool.query(query, [proveedor_id, tipo, monto, descripcion]);
        return result.rows[0];
    }
};

module.exports = ProveedorModel;
