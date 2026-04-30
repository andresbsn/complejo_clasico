const pool = require('../config/db');

const VentaModel = {
    // Crear una nueva venta con sus detalles
    async create(ventaData) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 0. Obtener caja abierta
            const cajaRes = await client.query("SELECT id FROM cajas WHERE estado = 'abierta' LIMIT 1");
            const cajaId = cajaRes.rows.length > 0 ? cajaRes.rows[0].id : null;

            const { items, total, usuario_id, observaciones } = ventaData;
            let { pagos } = ventaData;

            // Backward compatibility / Single payment handling
            if (!pagos || pagos.length === 0) {
                const { metodo_pago, jugador_id } = ventaData; // Legacy fields
                pagos = [{
                    metodo: metodo_pago,
                    monto: total,
                    jugador_id: jugador_id
                }];
            }

            // Determine aggregate method name for the sale record
            const metodo_pago_global = pagos.length > 1 ? 'multiple' : pagos[0].metodo;

            // 1. Insertar la venta
            const ventaQuery = `
                INSERT INTO ventas_cantina (total, metodo_pago, caja_id, observaciones)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `;
            const ventaResult = await client.query(ventaQuery, [total, metodo_pago_global, cajaId, observaciones]);
            const venta = ventaResult.rows[0];

            // 1.5 Procesar pagos
            for (const pago of pagos) {
                // Insertar en pagos_ventas
                await client.query(`
                    INSERT INTO pagos_ventas (venta_id, metodo, monto)
                    VALUES ($1, $2, $3)
                `, [venta.id, pago.metodo, pago.monto]);

                // Si es cuenta corriente, registrar movimiento en cuenta del jugador
                if (pago.metodo === 'cuenta_corriente') {
                    if (!pago.jugador_id) throw new Error('Se requiere jugador_id para pago con cuenta corriente');

                    const movimientoQuery = `
                        INSERT INTO movimientos_cuenta (jugador_id, tipo, monto, descripcion, referencia_id, caja_id)
                        VALUES ($1, 'DEBE', $2, $3, $4, $5)
                    `;
                    await client.query(movimientoQuery, [
                        pago.jugador_id,
                        pago.monto,
                        `Compra en Cantina (Venta #${venta.id})`,
                        venta.id,
                        cajaId
                    ]);
                }
            }

            let costoTotalVenta = 0;

            // 2. Insertar detalles y actualizar stock
            for (const item of items) {
                const { producto_id, cantidad, precio_unitario } = item;

                // Validar stock y obtener costo
                const prodQuery = 'SELECT stock, costo FROM productos WHERE id = $1 FOR UPDATE';
                const prodResult = await client.query(prodQuery, [producto_id]);

                if (prodResult.rows.length === 0) {
                    throw new Error(`Producto ${producto_id} no encontrado`);
                }

                const product = prodResult.rows[0];
                const currentStock = product.stock;
                const costoUnitario = parseFloat(product.costo || 0);

                if (currentStock < cantidad) {
                    throw new Error(`Stock insuficiente para el producto ${producto_id}`);
                }

                costoTotalVenta += (costoUnitario * cantidad);

                // Insertar detalle
                const detalleQuery = `
                    INSERT INTO detalle_venta_cantina (venta_id, producto_id, cantidad, precio_unitario, subtotal)
                    VALUES ($1, $2, $3, $4, $5)
                `;
                const subtotal = cantidad * precio_unitario;
                await client.query(detalleQuery, [venta.id, producto_id, cantidad, precio_unitario, subtotal]);

                // Actualizar stock
                const updateStockQuery = `
                    UPDATE productos
                    SET stock = stock - $1
                    WHERE id = $2
                `;
                await client.query(updateStockQuery, [cantidad, producto_id]);
            }

            // 3. Si es cortesía TOTAL (gastos_generales), generar un gasto por el COSTO de los productos
            if (metodo_pago_global === 'gastos_generales') {
                const gastoQuery = `
                    INSERT INTO gastos (descripcion, monto, caja_id, usuario_id)
                    VALUES ($1, $2, $3, $4)
                `;
                await client.query(gastoQuery, [
                    `Cortesía/Gasto Cantina (Venta #${venta.id})`,
                    costoTotalVenta,
                    cajaId,
                    usuario_id
                ]);
            }

            await client.query('COMMIT');
            return venta;
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    },

    // Obtener todas las ventas
    async getAll(fechaDesde, fechaHasta) {
        let query = 'SELECT * FROM ventas_cantina';
        const values = [];
        const conditions = [];

        if (fechaDesde) {
            conditions.push(`(fecha AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires')::date >= $${values.length + 1}`);
            values.push(fechaDesde);
        }

        if (fechaHasta) {
            conditions.push(`(fecha AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires')::date <= $${values.length + 1}`);
            values.push(fechaHasta);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY fecha DESC';

        const result = await pool.query(query, values);
        return result.rows;
    },

    // Obtener detalles de una venta
    async getDetalles(ventaId) {
        const query = `
            SELECT dv.*, p.nombre as producto_nombre
            FROM detalle_venta_cantina dv
            JOIN productos p ON dv.producto_id = p.id
            WHERE dv.venta_id = $1
        `;
        const result = await pool.query(query, [ventaId]);
        return result.rows;
    },

    // Generar Nota de Crédito (Anular venta)
    async generarNotaCredito(ventaId, usuarioId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 0. Comprobar caja abierta
            const cajaRes = await client.query("SELECT id FROM cajas WHERE estado = 'abierta' LIMIT 1");
            const cajaId = cajaRes.rows.length > 0 ? cajaRes.rows[0].id : null;

            // 1. Obtener la venta original
            const ventaRes = await client.query('SELECT * FROM ventas_cantina WHERE id = $1', [ventaId]);
            if (ventaRes.rows.length === 0) throw new Error('Venta no encontrada');
            const venta = ventaRes.rows[0];

            // Verificar si ya tiene nota de crédito o si ya fue anulada
            const ncCheck = await client.query('SELECT id FROM ventas_cantina WHERE observaciones = $1 OR observaciones LIKE $2', [
                `Nota de Crédito Venta #${ventaId}`,
                `%NC Venta #${ventaId}%`
            ]);
            if (ncCheck.rows.length > 0) throw new Error('Esta venta ya tiene una nota de crédito o fue anulada');

            // También verificar que no estemos intentando hacer nota de crédito de una nota de crédito
            if (venta.observaciones && venta.observaciones.includes('Nota de Crédito')) {
                throw new Error('No se puede generar una nota de crédito de otra nota de crédito');
            }

            // 2. Insertar Venta Negativa (Nota de Crédito)
            const ncQuery = `
                INSERT INTO ventas_cantina (total, metodo_pago, caja_id, observaciones)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `;
            const ncResult = await client.query(ncQuery, [
                -parseFloat(venta.total),
                venta.metodo_pago,
                cajaId,
                `Nota de Crédito Venta #${ventaId}`
            ]);
            const nc = ncResult.rows[0];

            // 3. Obtener y revertir pagos
            const pagosRes = await client.query('SELECT * FROM pagos_ventas WHERE venta_id = $1', [ventaId]);
            for (const pago of pagosRes.rows) {
                await client.query(`
                    INSERT INTO pagos_ventas (venta_id, metodo, monto)
                    VALUES ($1, $2, $3)
                `, [nc.id, pago.metodo, -parseFloat(pago.monto)]);

                // Revertir en cuenta corriente si el método fue cuenta_corriente
                if (pago.metodo === 'cuenta_corriente') {
                    // Buscar a qué jugador se le cargó la venta
                    const movRes = await client.query(`SELECT jugador_id FROM movimientos_cuenta WHERE referencia_id = $1 AND tipo = 'DEBE' AND descripcion LIKE '%Venta #%' LIMIT 1`, [venta.id]);
                    if (movRes.rows.length > 0) {
                        const jugador_id = movRes.rows[0].jugador_id;
                        await client.query(`
                            INSERT INTO movimientos_cuenta (jugador_id, tipo, monto, descripcion, referencia_id, caja_id)
                            VALUES ($1, 'HABER', $2, $3, $4, $5)
                        `, [jugador_id, parseFloat(pago.monto), `Anulación Venta #${venta.id} (NC)`, nc.id, cajaId]);
                    }
                }
            }

            // 4. Obtener detalles, revertir stock y subtotal
            const detallesRes = await client.query('SELECT * FROM detalle_venta_cantina WHERE venta_id = $1', [ventaId]);
            let costoTotalVenta = 0;

            for (const item of detallesRes.rows) {
                const prodRes = await client.query('SELECT costo FROM productos WHERE id = $1', [item.producto_id]);
                const costoUnitario = prodRes.rows.length > 0 ? parseFloat(prodRes.rows[0].costo || 0) : 0;
                costoTotalVenta += (costoUnitario * item.cantidad);

                // Insertar detalle negativo
                await client.query(`
                    INSERT INTO detalle_venta_cantina (venta_id, producto_id, cantidad, precio_unitario, subtotal)
                    VALUES ($1, $2, $3, $4, $5)
                `, [
                    nc.id,
                    item.producto_id,
                    -parseInt(item.cantidad),
                    parseFloat(item.precio_unitario),
                    -parseFloat(item.subtotal)
                ]);

                // Devolver stock al producto
                await client.query(`
                    UPDATE productos
                    SET stock = stock + $1
                    WHERE id = $2
                `, [parseInt(item.cantidad), item.producto_id]);
            }

            // 5. Si la venta original fue cargada a gastos_generales (cortesía), 
            // revertir el gasto generado
            if (venta.metodo_pago === 'gastos_generales') {
                await client.query(`
                     INSERT INTO gastos (descripcion, monto, caja_id, usuario_id)
                     VALUES ($1, $2, $3, $4)
                 `, [
                    `Anulación Cortesía (Venta #${ventaId})`,
                    -costoTotalVenta,
                    cajaId,
                    usuarioId || null
                ]);
            }

            await client.query('COMMIT');
            return nc;
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }
};

module.exports = VentaModel;
