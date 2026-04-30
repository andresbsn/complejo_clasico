import axios from 'axios';
import { alerts } from '../utils/alerts';

const api = axios.create({
    // baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    baseURL: import.meta.env.VITE_API_URL || '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    console.log(`[Request] ${config.method.toUpperCase()} ${config.url}`, { tokenExists: !!token });
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response && error.response.status === 403 && error.response.data.redirectTo) {
            await alerts.error('Operación no permitida', error.response.data.message || 'La caja debe estar abierta para realizar esta operación.');
            window.location.href = error.response.data.redirectTo;
        }
        return Promise.reject(error);
    }
);

export const TurnoService = {
    getAll: async (fecha, canchaId) => {
        const params = { fecha };
        if (canchaId) params.cancha_id = canchaId;
        const response = await api.get('/turnos', { params });
        return response.data;
    },

    create: async (turnoData) => {
        const response = await api.post('/turnos', turnoData);
        return response.data;
    },

    updateStatus: async (id, estado) => {
        const response = await api.patch(`/turnos/${id}/status`, { estado });
        return response.data;
    }
};

export const ProductoService = {
    getAll: async (params = {}) => {
        const response = await api.get('/productos', { params });
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/productos', data);
        return response.data;
    },
    update: async (id, data) => {
        const response = await api.put(`/productos/${id}`, data);
        return response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/productos/${id}`);
        return response.data;
    }
};

export const VentaService = {
    create: async (ventaData) => {
        const response = await api.post('/ventas', ventaData);
        return response.data;
    },
    getAll: async (params) => {
        const response = await api.get('/ventas', { params });
        return response.data;
    },
    getDetalles: async (id) => {
        const response = await api.get(`/ventas/${id}/detalles`);
        return response.data;
    },
    generarNotaCredito: async (id) => {
        const response = await api.post(`/ventas/${id}/nota-credito`);
        return response.data;
    }
};

export const CanchaService = {
    getAll: async (params) => {
        const response = await api.get('/canchas', { params });
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/canchas', data);
        return response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/canchas/${id}`);
        return response.data;
    }
};

export const ConfiguracionService = {
    getAll: async () => {
        const response = await api.get('/configuracion');
        return response.data;
    },
    update: async (clave, valor) => {
        const response = await api.put(`/configuracion/${clave}`, { valor });
        return response.data;
    }
};

export const JugadorService = {
    getAll: async (search = '') => {
        const params = search ? { search } : {};
        const response = await api.get('/jugadores', { params });
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/jugadores', data);
        return response.data;
    },
    update: async (id, data) => {
        const response = await api.put(`/jugadores/${id}`, data);
        return response.data;
    }
};


export const CuentaService = {
    getMovimientos: async (jugadorId) => {
        const response = await api.get(`/cuentas/${jugadorId}`);
        return response.data;
    },
    addMovimiento: async (data) => {
        const response = await api.post('/cuentas', data);
        return response.data;
    }
};

export const ProveedorService = {
    async getAll() {
        const response = await api.get('/proveedores');
        return response.data;
    },
    async create(data) {
        const response = await api.post('/proveedores', data);
        return response.data;
    },
    async update(id, data) {
        const response = await api.put(`/proveedores/${id}`, data);
        return response.data;
    },
    async delete(id) {
        const response = await api.delete(`/proveedores/${id}`);
        return response.data;
    },
    async getMovimientos(id) {
        const response = await api.get(`/proveedores/${id}/cuenta`);
        return response.data;
    },
    async addMovimiento(data) {
        const response = await api.post('/proveedores/movimiento', data);
        return response.data;
    }
};

export const ReporteService = {
    async getVentas(filters) {
        // filters: { fechaDesde, fechaHasta, tipo, metodoPago }
        const params = new URLSearchParams();
        if (filters.fechaDesde) params.append('fechaDesde', filters.fechaDesde);
        if (filters.fechaHasta) params.append('fechaHasta', filters.fechaHasta);
        if (filters.tipo) params.append('tipo', filters.tipo);
        if (filters.metodoPago) params.append('metodoPago', filters.metodoPago);
        if (filters.categoriaVenta) params.append('categoriaVenta', filters.categoriaVenta);

        const response = await api.get(`/reportes/ventas?${params.toString()}`);
        return response.data;
    },
    async getJugadoresPorCategoria(filters = {}) {
        const params = new URLSearchParams();
        if (filters.categoria_id) params.append('categoria_id', filters.categoria_id);
        if (filters.search) params.append('search', filters.search);
        const response = await api.get(`/reportes/jugadores-categoria?${params.toString()}`);
        return response.data;
    },
    async getDeudores() {
        const response = await api.get('/reportes/deudores');
        return response.data;
    }
};

export const UserService = {
    async getAll() {
        const response = await api.get('/users');
        return response.data;
    },
    async create(data) {
        const response = await api.post('/users', data);
        return response.data;
    },
    async delete(id) {
        const response = await api.delete(`/users/${id}`);
        return response.data;
    }
};
export const TorneoService = {
    getAll: async () => {
        const response = await api.get('/torneos');
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/torneos', data);
        return response.data;
    },
    getById: async (id) => {
        const response = await api.get(`/torneos/${id}`);
        return response.data;
    },
    inscribir: async (id, jugadorId) => {
        const response = await api.post(`/torneos/${id}/inscripciones`, { jugador_id: jugadorId });
        return response.data;
    },
    registrarPago: async (id, inscripcionId, data) => {
        const response = await api.post(`/torneos/${id}/inscripciones/${inscripcionId}/pagos`, data);
        return response.data;
    },
    darDeBaja: async (id, inscripcionId) => {
        const response = await api.put(`/torneos/${id}/inscripciones/${inscripcionId}/baja`);
        return response.data;
    }
};

export const CategoriaService = {
    getAll: async () => {
        const response = await api.get('/categorias');
        return response.data;
    }
};

export const CajaService = {
    abrir: async (saldo_inicial) => {
        const response = await api.post('/cajas/abrir', { saldo_inicial });
        return response.data;
    },
    cerrar: async (id, saldo_final) => {
        const response = await api.put(`/cajas/${id}/cerrar`, { saldo_final });
        return response.data;
    },
    getEstado: async () => {
        const response = await api.get('/cajas/estado');
        return response.data;
    },
    getMovimientos: async (id) => {
        const response = await api.get(`/cajas/${id}/movimientos`);
        return response.data;
    },
    getHistorial: async () => {
        const response = await api.get('/cajas/historial');
        return response.data;
    },
    getById: async (id) => {
        const response = await api.get(`/cajas/${id}`);
        return response.data;
    },
    getVentaDetalles: async (id) => {
        const response = await api.get(`/ventas/${id}/detalles`);
        return response.data;
    }
};

export const CompraService = {
    getAll: async () => {
        const response = await api.get('/compras');
        return response.data;
    },
    getById: async (id) => {
        const response = await api.get(`/compras/${id}`);
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/compras', data);
        return response.data;
    },
    update: async (id, data) => {
        const response = await api.put(`/compras/${id}`, data);
        return response.data;
    },
    confirmar: async (id) => {
        const response = await api.post(`/compras/${id}/confirmar`);
        return response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/compras/${id}`);
        return response.data;
    }
};

export const GastoService = {
    getAll: async () => {
        const response = await api.get('/gastos');
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/gastos', data);
        return response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/gastos/${id}`);
        return response.data;
    }
};

export default api;
