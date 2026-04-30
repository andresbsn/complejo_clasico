import React, { useState, useEffect } from 'react';
import { TurnoService, CanchaService, ConfiguracionService } from '../services/api';
import { alerts } from '../utils/alerts';

const TurnoForm = ({ onTurnoCreated }) => {
  const [formData, setFormData] = useState({
    cancha_id: '',
    fecha: '',
    hora_inicio: '',
    hora_fin: '',
    cliente_nombre: '',
    cliente_telefono: '',
    monto_total: ''
  });
  const [canchas, setCanchas] = useState([]);
  const [config, setConfig] = useState({});

  useEffect(() => {
    const fetchData = async () => {
        try {
            const [canchasData, configData] = await Promise.all([
                CanchaService.getAll(),
                ConfiguracionService.getAll()
            ]);
            setCanchas(canchasData);
            setConfig(configData);
        } catch (error) {
            console.error('Error al cargar datos:', error);
        }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    let newFormData = { ...formData, [name]: fieldValue };

    // Calculate price logic
    const canchaId = name === 'cancha_id' ? value : formData.cancha_id;
    const esFijo = name === 'es_fijo' ? checked : (formData.es_fijo || false);

    if (canchaId && (name === 'cancha_id' || name === 'es_fijo')) {
        const cancha = canchas.find(c => c.id === parseInt(canchaId));
        if (cancha) {
            if (cancha.tipo === 'padel') {
                if (esFijo && config.PRECIO_PADEL_FIJO) {
                    newFormData.monto_total = config.PRECIO_PADEL_FIJO;
                } else if (config.PRECIO_PADEL) {
                    newFormData.monto_total = config.PRECIO_PADEL;
                }
            } else if (cancha.tipo === 'futbol' && config.PRECIO_FUTBOL) {
                newFormData.monto_total = config.PRECIO_FUTBOL;
            }
        }
    }

    setFormData(newFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await TurnoService.create(formData);
      alerts.success('¡Éxito!', 'Turno creado exitosamente');
      if (onTurnoCreated) onTurnoCreated();
      // Reset form or close modal
    } catch (error) {
      console.error('Error al crear turno:', error);
      alerts.error('Error', error.response?.data?.error || 'No se pudo crear el turno');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded bg-gray-50">
      <h3 className="text-xl font-bold">Nuevo Turno</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Cancha</label>
          <select name="cancha_id" onChange={handleChange} className="w-full p-2 border rounded" required>
            <option value="">Seleccionar...</option>
            {canchas.map(cancha => (
                <option key={cancha.id} value={cancha.id}>{cancha.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Fecha</label>
          <input type="date" name="fecha" onChange={handleChange} className="w-full p-2 border rounded" required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Hora Inicio</label>
          <input type="time" name="hora_inicio" onChange={handleChange} className="w-full p-2 border rounded" required />
        </div>
        <div>
          <label className="block text-sm font-medium">Hora Fin</label>
          <input type="time" name="hora_fin" onChange={handleChange} className="w-full p-2 border rounded" required />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Cliente</label>
        <input type="text" name="cliente_nombre" placeholder="Nombre completo" onChange={handleChange} className="w-full p-2 border rounded" required />
      </div>

      <div>
        <label className="block text-sm font-medium">Teléfono</label>
        <input type="tel" name="cliente_telefono" placeholder="WhatsApp / Tel" onChange={handleChange} className="w-full p-2 border rounded" />
      </div>

      <div>
        <label className="block text-sm font-medium">Monto Total ($)</label>
        <input 
            type="number" 
            name="monto_total" 
            value={formData.monto_total} 
            onChange={handleChange} 
            className="w-full p-2 border rounded" 
            required 
        />
      </div>

      <div className="flex items-center">
        <input 
          type="checkbox" 
          name="es_fijo" 
          id="es_fijo"
          checked={formData.es_fijo || false} 
          onChange={handleChange} 
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="es_fijo" className="ml-2 block text-sm text-gray-900">
          Repetir semanalmente (Fijo)
        </label>
      </div>

      <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
        Guardar Turno
      </button>
    </form>
  );
};

export default TurnoForm;
