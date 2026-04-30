require('dotenv').config();
const express = require('express');
const cors = require('cors');
const turnoRoutes = require('./routes/turnoRoutes');
const canchaRoutes = require('./routes/canchaRoutes');
const productoRoutes = require('./routes/productoRoutes');
const ventaRoutes = require('./routes/ventaRoutes');
const configuracionRoutes = require('./routes/configuracionRoutes');
const authRoutes = require('./routes/authRoutes');
const jugadorRoutes = require('./routes/jugadorRoutes');
const cuentaRoutes = require('./routes/cuentaRoutes');
const proveedorRoutes = require('./routes/proveedorRoutes');
const torneoRoutes = require('./routes/torneoRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const authMiddleware = require('./middleware/authMiddleware');
const reporteRoutes = require('./routes/reporteRoutes');
const userRoutes = require('./routes/userRoutes');
const cajaRoutes = require('./routes/cajaRoutes');
const compraRoutes = require('./routes/compraRoutes');
const gastoRoutes = require('./routes/gastoRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas Públicas
app.use('/api/auth', authRoutes);

// Rutas Protegidas
app.use('/api/canchas', authMiddleware, canchaRoutes);
app.use('/api/turnos', authMiddleware, turnoRoutes);
app.use('/api/productos', authMiddleware, productoRoutes);
app.use('/api/ventas', authMiddleware, ventaRoutes);
app.use('/api/configuracion', authMiddleware, configuracionRoutes);
app.use('/api/jugadores', authMiddleware, jugadorRoutes);
app.use('/api/cuentas', authMiddleware, cuentaRoutes);
app.use('/api/proveedores', authMiddleware, proveedorRoutes);
app.use('/api/reportes', authMiddleware, reporteRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/torneos', authMiddleware, torneoRoutes);
app.use('/api/categorias', authMiddleware, categoriaRoutes);
app.use('/api/cajas', authMiddleware, cajaRoutes);
app.use('/api/compras', authMiddleware, compraRoutes);
app.use('/api/gastos', authMiddleware, gastoRoutes);


// Ruta de prueba
app.get('/', (req, res) => {
    res.send('API del Complejo Deportivo funcionando');
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Algo salió mal!');
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en el puerto ${PORT}`);
    });
}

module.exports = app;
