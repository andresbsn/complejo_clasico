const TurnoModel = require('../models/TurnoModel');

const TurnoController = {
    async createTurno(req, res) {
        try {
            // Aquí irían validaciones de entrada (zod, joi, etc.)
            const { es_fijo, fecha, ...restoDatos } = req.body;

            let turno;
            if (es_fijo) {
                // Calcular dia_semana desde la fecha proporcionada
                const dateObj = new Date(fecha);
                // getDay() devuelve 0 para Domingo, pero en JS Date(string) puede ser UTC.
                // Aseguramos que tomamos el día correcto asumiendo que la fecha viene YYYY-MM-DD
                // Una forma segura es crear la fecha con hora local o usar una librería, 
                // pero para este ejemplo simple:
                const dia_semana = new Date(fecha + 'T12:00:00').getDay();

                turno = await TurnoModel.createFijo({ ...restoDatos, dia_semana });
            } else {
                turno = await TurnoModel.create({ ...req.body });
            }

            res.status(201).json(turno);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al crear el turno: ' + error.message });
        }
    },

    async getTurnos(req, res) {
        try {
            const { fecha, cancha_id } = req.query;
            if (!fecha) {
                return res.status(400).json({ error: 'El parámetro fecha es requerido' });
            }
            const turnos = await TurnoModel.getByDate(fecha, cancha_id);
            res.json(turnos);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener turnos' });
        }
    },

    async registrarPago(req, res) {
        try {
            const { id } = req.params; // turno_id
            const { monto, metodo, observaciones, jugador_id } = req.body;

            const PagoModel = require('../models/PagoModel'); // Lazy load to avoid circular deps if any
            const pago = await PagoModel.create({
                turno_id: id,
                monto,
                metodo,
                observaciones,
                jugador_id
            });

            res.status(201).json(pago);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al registrar el pago' });
        }
    },

    async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { estado } = req.body;
            const turno = await TurnoModel.updateStatus(id, estado);
            res.json(turno);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al actualizar estado' });
        }
    },

    async deleteFijo(req, res) {
        try {
            const { id } = req.params;
            const deleted = await TurnoModel.deleteFijo(id);
            if (!deleted) {
                return res.status(404).json({ error: 'Turno fijo no encontrado' });
            }
            res.json({ message: 'Turno fijo eliminado correctamente', turno: deleted });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al eliminar turno fijo' });
        }
    }
};

module.exports = TurnoController;
