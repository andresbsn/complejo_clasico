const pool = require('../config/db');

const reporteController = {
    getVentasReport: async (req, res) => {
        try {
            const { fechaDesde, fechaHasta, tipo, metodoPago, categoriaVenta } = req.query;

            let finalQuery = `
                SELECT * FROM (
                    SELECT 
                        v.id, 
                        v.fecha, 
                        'VENTA' as tipo, 
                        'Venta Cantina #' || v.id as descripcion, 
                        v.metodo_pago as metodo, 
                        v.total as monto, 
                        (CASE WHEN v.metodo_pago = 'gastos_generales' THEN 0 ELSE v.total END - 
                            COALESCE((SELECT SUM(d.cantidad * p.costo) 
                                      FROM detalle_venta_cantina d 
                                      JOIN productos p ON d.producto_id = p.id 
                                      WHERE d.venta_id = v.id), 0)
                        ) as ganancia,
                        v.observaciones,
                        'cantina' as categoria_venta
                    FROM ventas_cantina v
                    UNION ALL
                    SELECT 
                        p.id, 
                        p.fecha_pago as fecha, 
                        'RESERVA' as tipo, 
                        'Pago Turno ' || CASE WHEN c.tipo = 'PADEL' THEN 'Padel' ELSE 'Fútbol' END || ' ' || c.nombre as descripcion, 
                        p.metodo, 
                        p.monto,
                        p.monto as ganancia,
                        p.observaciones,
                        LOWER(c.tipo) as categoria_venta
                    FROM pagos p
                    JOIN turnos t ON p.turno_id = t.id
                    JOIN canchas c ON t.cancha_id = c.id
                    UNION ALL
                    SELECT
                        i.id,
                        i.fecha_pago as fecha,
                        'INSCRIPCION' as tipo,
                        'Inscripción Torneo: ' || t.descripcion || ' - ' || j.nombre as descripcion,
                        i.metodo_pago as metodo,
                        i.monto_abonado as monto,
                        0 as ganancia,
                        NULL as observaciones,
                        'torneo' as categoria_venta
                    FROM inscripciones i
                    JOIN torneos t ON i.torneo_id = t.id
                    JOIN jugadores j ON i.jugador_id = j.id
                    WHERE i.pagado = TRUE
                ) as combined
                WHERE 1=1
            `;

            let paramCounter = 1;
            let finalParams = [];

            if (fechaDesde) {
                finalQuery += ` AND (fecha AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires')::date >= $${paramCounter}`;
                finalParams.push(fechaDesde);
                paramCounter++;
            }
            if (fechaHasta) {
                finalQuery += ` AND (fecha AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires')::date <= $${paramCounter}`;
                finalParams.push(fechaHasta);
                paramCounter++;
            }
            if (tipo) {
                finalQuery += ` AND tipo = $${paramCounter}`;
                finalParams.push(tipo);
                paramCounter++;
            }
            if (metodoPago) {
                finalQuery += ` AND metodo = $${paramCounter}`;
                finalParams.push(metodoPago);
                paramCounter++;
            }
            if (categoriaVenta) {
                finalQuery += ` AND categoria_venta = $${paramCounter}`;
                finalParams.push(categoriaVenta);
                paramCounter++;
            }

            finalQuery += ` ORDER BY fecha DESC`;

            const result = await pool.query(finalQuery, finalParams);
            res.json(result.rows);

        } catch (error) {
            console.error('Error getting sales report:', error);
            res.status(500).json({ error: 'Error al generar reporte' });
        }
    },

    getJugadoresPorCategoria: async (req, res) => {
        try {
            const { categoria_id, search } = req.query;
            let query = `
                SELECT j.*, c.descripcion as categoria_descripcion,
                COALESCE(SUM(CASE WHEN m.tipo = 'DEBE' THEN m.monto ELSE -m.monto END), 0) as saldo
                FROM jugadores j
                LEFT JOIN categorias c ON j.categoria_id = c.id
                LEFT JOIN movimientos_cuenta m ON j.id = m.jugador_id
            `;

            let whereConditions = [];
            let params = [];
            let paramCounter = 1;

            if (categoria_id) {
                whereConditions.push(`j.categoria_id = $${paramCounter}`);
                params.push(categoria_id);
                paramCounter++;
            }

            if (search) {
                whereConditions.push(`j.nombre ILIKE $${paramCounter}`);
                params.push(`%${search}%`);
                paramCounter++;
            }

            if (whereConditions.length > 0) {
                query += ` WHERE ${whereConditions.join(' AND ')}`;
            }

            query += `
                GROUP BY j.id, c.descripcion
                ORDER BY c.descripcion ASC, j.nombre ASC
            `;

            const result = await pool.query(query, params);
            res.json(result.rows);
        } catch (error) {
            console.error('Error getting players by category report:', error);
            res.status(500).json({ error: 'Error al generar reporte de jugadores' });
        }
    },

    getDeudores: async (req, res) => {
        try {
            const query = `
                SELECT j.*, c.descripcion as categoria_descripcion,
                COALESCE(SUM(CASE WHEN m.tipo = 'DEBE' THEN m.monto ELSE -m.monto END), 0) as saldo
                FROM jugadores j
                LEFT JOIN categorias c ON j.categoria_id = c.id
                LEFT JOIN movimientos_cuenta m ON j.id = m.jugador_id
                GROUP BY j.id, c.descripcion
                HAVING COALESCE(SUM(CASE WHEN m.tipo = 'DEBE' THEN m.monto ELSE -m.monto END), 0) > 0
                ORDER BY saldo DESC
            `;
            const result = await pool.query(query);
            res.json(result.rows);
        } catch (error) {
            console.error('Error getting debtors report:', error);
            res.status(500).json({ error: 'Error al generar reporte de deudores' });
        }
    }
};

module.exports = reporteController;
