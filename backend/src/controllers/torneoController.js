const TorneoModel = require('../models/TorneoModel');
const InscripcionModel = require('../models/InscripcionModel');

const TorneoController = {
    async create(req, res) {
        try {
            const torneo = await TorneoModel.create(req.body);
            res.status(201).json(torneo);
        } catch (error) {
            console.error('Error al crear torneo:', error);
            res.status(500).json({ error: 'Error al crear torneo' });
        }
    },

    async getAll(req, res) {
        try {
            const torneos = await TorneoModel.getAll();
            res.json(torneos);
        } catch (error) {
            console.error('Error al obtener torneos:', error);
            res.status(500).json({ error: 'Error al obtener torneos' });
        }
    },

    async getById(req, res) {
        try {
            const { id } = req.params;
            const torneo = await TorneoModel.getById(id);
            if (!torneo) {
                return res.status(404).json({ error: 'Torneo no encontrado' });
            }
            // Obtener inscripciones
            const inscripciones = await InscripcionModel.getByTorneo(id);

            res.json({ ...torneo, inscripciones });
        } catch (error) {
            console.error('Error al obtener torneo:', error);
            res.status(500).json({ error: 'Error al obtener torneo' });
        }
    },

    async inscribirJugador(req, res) {
        try {
            const { id } = req.params; // torneo_id
            const { jugador_id } = req.body;

            // Verificar si ya estÃ¡ inscripto? (Database constraint handles it, but good to check)

            const inscripcion = await InscripcionModel.create({ torneo_id: id, jugador_id });
            res.status(201).json(inscripcion);
        } catch (error) {
            if (error.code === '23505') { // Unique constraint violation
                return res.status(400).json({ error: 'El jugador ya estÃ¡ inscripto en este torneo' });
            }
            console.error('Error al inscribir jugador:', error);
            res.status(500).json({ error: 'Error al inscribir jugador' });
        }
    },

    async registrarPagoInscripcion(req, res) {
        try {
            const { id, inscripcionId } = req.params;
            // The body can now be a single payment object or an array of payment objects
            // The model handles the transition to supporting multiple payments
            const inscripcion = await InscripcionModel.registrarPago(inscripcionId, req.body);
            res.json(inscripcion);
        } catch (error) {
            console.error('Error al registrar pago de inscripcion:', error);
            res.status(500).json({ error: 'Error al registrar pago' });
        }
    },

    async darDeBaja(req, res) {
        try {
            const { inscripcionId } = req.params;
            const inscripcion = await InscripcionModel.cambiarEstado(inscripcionId, 'baja');
            res.json(inscripcion);
        } catch (error) {
            console.error('Error al dar de baja:', error);
            res.status(500).json({ error: 'Error al dar de baja' });
        }
    }
};

module.exports = TorneoController;
