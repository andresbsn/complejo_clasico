const pool = require('../config/db');

const CompraModel = {
    async create(data) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const { proveedor_id, items, observaciones } = data;

            // Calculate total
            let total = 0;
            items.forEach(item => {
                total += item.cantidad * item.costo_unitario;
            });

            // 1. Create Compra
            const compraQuery = `
                INSERT INTO compras (proveedor_id, total, observaciones, estado)
                VALUES ($1, $2, $3, 'PENDIENTE')
                RETURNING *
            `;
            const compraResult = await client.query(compraQuery, [proveedor_id, total, observaciones]);
            const compra = compraResult.rows[0];

            // 2. Create Details
            for (const item of items) {
                const subtotal = item.cantidad * item.costo_unitario;
                await client.query(`
                    INSERT INTO detalle_compra (compra_id, producto_id, cantidad, costo_unitario, subtotal)
                    VALUES ($1, $2, $3, $4, $5)
                `, [compra.id, item.producto_id, item.cantidad, item.costo_unitario, subtotal]);
            }

            // 3. Register Debt (Movimiento Proveedor)
            await client.query(`
                INSERT INTO movimientos_proveedor (proveedor_id, tipo, monto, descripcion)
                VALUES ($1, 'DEBE', $2, $3)
            `, [proveedor_id, total, `Compra #${compra.id}`]);

            await client.query('COMMIT');
            return compra;
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    },

    async update(id, data) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const { items, observaciones } = data;

            // Check status
            const currentRes = await client.query('SELECT * FROM compras WHERE id = $1', [id]);
            if (currentRes.rows.length === 0) throw new Error('Compra no encontrada');
            if (currentRes.rows[0].estado !== 'PENDIENTE') throw new Error('Solo se pueden editar compras pendientes');

            const proveedor_id = currentRes.rows[0].proveedor_id;

            // Calculate new total
            let total = 0;
            items.forEach(item => {
                total += item.cantidad * item.costo_unitario;
            });

            // 1. Update Compra
            await client.query(`
                UPDATE compras SET total = $1, observaciones = $2 WHERE id = $3
            `, [total, observaciones, id]);

            // 2. Replace Details (Delete and Insert)
            await client.query('DELETE FROM detalle_compra WHERE compra_id = $1', [id]);
            for (const item of items) {
                const subtotal = item.cantidad * item.costo_unitario;
                await client.query(`
                    INSERT INTO detalle_compra (compra_id, producto_id, cantidad, costo_unitario, subtotal)
                    VALUES ($1, $2, $3, $4, $5)
                `, [id, item.producto_id, item.cantidad, item.costo_unitario, subtotal]);
            }

            // 3. Update Debt Movement
            // We need to find the movement associated with this purchase.
            // Assuming description format 'Compra #ID' is unique enough or we add a reference column later.
            // For now, update by description and proveedor roughly, or best effort.
            // Ideally, `movimientos_proveedor` should have a `referencia_id` and `tipo_referencia`.
            // User didn't migrate that, so we use description as key for now or rely on "Last DEBE matching amount?"
            // Risky. Let's try to update based on description.
            await client.query(`
                UPDATE movimientos_proveedor 
                SET monto = $1 
                WHERE proveedor_id = $2 AND descripcion = $3 AND tipo = 'DEBE'
            `, [total, proveedor_id, `Compra #${id}`]);

            await client.query('COMMIT');
            return { id, total, status: 'updated' };
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    },

    async confirmarStock(id) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Check status
            const currentRes = await client.query('SELECT * FROM compras WHERE id = $1', [id]);
            if (currentRes.rows.length === 0) throw new Error('Compra no encontrada');
            if (currentRes.rows[0].estado !== 'PENDIENTE') throw new Error('La compra ya fue procesada');

            // Get Details
            const detailsRes = await client.query('SELECT * FROM detalle_compra WHERE compra_id = $1', [id]);
            const details = detailsRes.rows;

            // Update Stock and Cost
            for (const item of details) {
                await client.query(`
                    UPDATE productos 
                    SET stock = stock + $1, costo = $2
                    WHERE id = $3
                `, [item.cantidad, item.costo_unitario, item.producto_id]);
            }

            // Update Status
            await client.query("UPDATE compras SET estado = 'RECIBIDO' WHERE id = $1", [id]);

            await client.query('COMMIT');
            return { message: 'Stock actualizado correctamente' };
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    },

    async getAll() {
        const res = await pool.query(`
            SELECT c.*, p.nombre as proveedor_nombre 
            FROM compras c 
            JOIN proveedores p ON c.proveedor_id = p.id 
            ORDER BY c.fecha DESC
        `);
        return res.rows;
    },

    async getById(id) {
        const compraRes = await pool.query(`
            SELECT c.*, p.nombre as proveedor_nombre 
            FROM compras c 
            JOIN proveedores p ON c.proveedor_id = p.id 
            WHERE c.id = $1
        `, [id]);

        if (compraRes.rows.length === 0) return null;
        const compra = compraRes.rows[0];

        const detallesRes = await pool.query(`
            SELECT d.*, p.nombre as producto_nombre 
            FROM detalle_compra d
            JOIN productos p ON d.producto_id = p.id
            WHERE d.compra_id = $1
        `, [id]);

        compra.items = detallesRes.rows;
        return compra;
    },

    async delete(id) {
        // Only allowed if PENDIENTE
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const currentRes = await client.query('SELECT * FROM compras WHERE id = $1', [id]);
            if (currentRes.rows.length === 0) throw new Error('Compra no encontrada');
            if (currentRes.rows[0].estado !== 'PENDIENTE') throw new Error('No se puede eliminar una compra ya recibida');

            const proveedor_id = currentRes.rows[0].proveedor_id;

            // Delete details
            await client.query('DELETE FROM detalle_compra WHERE compra_id = $1', [id]);

            // Delete movement
            await client.query("DELETE FROM movimientos_proveedor WHERE proveedor_id = $1 AND descripcion = $2", [proveedor_id, `Compra #${id}`]);

            // Delete compra
            await client.query('DELETE FROM compras WHERE id = $1', [id]);

            await client.query('COMMIT');
            return { message: 'Compra eliminada' };
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }
};

module.exports = CompraModel;
