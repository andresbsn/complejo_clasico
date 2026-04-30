const pool = require('../config/db');

const DashboardController = {
    async getDailySummary(req, res) {
        try {
            const { fecha } = req.query; // YYYY-MM-DD
            if (!fecha) return res.status(400).json({ error: 'Fecha requerida' });

            // Total Turnos
            const turnosQuery = `
        SELECT COALESCE(SUM(monto_total), 0) as total_turnos
        FROM turnos 
        WHERE fecha = $1 AND pagado = true
      `;

            // Total Cantina (asumiendo tabla ventas_cantina)
            const cantinaQuery = `
        SELECT COALESCE(SUM(total), 0) as total_cantina
        FROM ventas_cantina 
        WHERE DATE(fecha) = $1
      `;

            const [turnosRes, cantinaRes] = await Promise.all([
                pool.query(turnosQuery, [fecha]),
                pool.query(cantinaQuery, [fecha])
            ]);

            res.json({
                fecha,
                ingresos_turnos: parseFloat(turnosRes.rows[0].total_turnos),
                ingresos_cantina: parseFloat(cantinaRes.rows[0].total_cantina),
                total_dia: parseFloat(turnosRes.rows[0].total_turnos) + parseFloat(cantinaRes.rows[0].total_cantina)
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener resumen' });
        }
    }
};

module.exports = DashboardController;
