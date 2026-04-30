import React, { useEffect, useState } from 'react';
import { TurnoService } from '../services/api';
import PagoModal from './PagoModal';
import { formatCurrency } from '../utils/formatters';
import { alerts } from '../utils/alerts';

const TurnoList = () => {
  const [turnos, setTurnos] = useState([]);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [selectedTurno, setSelectedTurno] = useState(null);

  useEffect(() => {
    fetchTurnos();
  }, [fecha]);

  const fetchTurnos = async () => {
    setLoading(true);
    try {
      const data = await TurnoService.getAll(fecha);
      setTurnos(data);
    } catch (error) {
      console.error('Error al cargar turnos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Agrupar turnos por cancha
  const turnosPorCancha = {
    'Cancha Padel 1': [],
    'Cancha Padel 2': [],
    'Cancha Futbol 5': []
  };

  turnos.forEach(turno => {
    if (turnosPorCancha[turno.cancha_nombre]) {
      turnosPorCancha[turno.cancha_nombre].push(turno);
    }
  });

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Agenda de Turnos</h2>
        <input 
          type="date" 
          value={fecha} 
          onChange={(e) => setFecha(e.target.value)}
          className="w-full md:w-auto border border-gray-300 rounded-lg px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {loading ? (
        <div className="text-center py-10">Cargando agenda...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(turnosPorCancha).map(([canchaNombre, turnosCancha]) => (
            <div key={canchaNombre} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-bold text-lg text-gray-700 mb-4 border-b pb-2">{canchaNombre}</h3>
              <div className="space-y-3">
                {turnosCancha.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Sin turnos</p>
                ) : (
                  turnosCancha.map(turno => (
                    <div 
                      key={turno.id} 
                      className={`p-3 rounded-lg border-l-4 shadow-sm bg-white cursor-pointer transition-transform hover:scale-[1.02] ${
                        turno.estado === 'cancelado' ? 'border-l-gray-400 bg-gray-100 opacity-75' :
                        turno.es_fijo ? 'border-l-purple-500' :
                        parseFloat(turno.monto_pagado) >= parseFloat(turno.monto_total) ? 'border-l-green-500' : 
                        parseFloat(turno.monto_pagado) > 0 ? 'border-l-orange-500' : 
                        turno.estado === 'confirmado' ? 'border-l-blue-500' : 'border-l-yellow-500'
                      }`}
                      onClick={() => {
                          if (turno.estado === 'cancelado') {
                              // Opcional: Permitir reactivar? Por ahora solo mostrar
                              return;
                          }
                          if (turno.es_fijo) {
                              alerts.confirm('Confirmar Asistencia', 'Este es un turno fijo. ¿Desea confirmar la asistencia para hoy y registrar el pago?')
                                .then(result => {
                                    if (result.isConfirmed) {
                                        TurnoService.create({
                                            cancha_id: turno.cancha_id,
                                            fecha: fecha,
                                            hora_inicio: turno.hora_inicio,
                                            hora_fin: turno.hora_fin,
                                            cliente_nombre: turno.cliente_nombre,
                                            cliente_telefono: turno.cliente_telefono,
                                            monto_total: turno.monto_total
                                        }).then(newTurno => {
                                            fetchTurnos(); 
                                            setSelectedTurno(newTurno); 
                                        }).catch(err => {
                                            alerts.error('Error', 'No se pudo crear el turno de asistencia.');
                                        });
                                    } else {
                                        setSelectedTurno({...turno, fecha: fecha}); 
                                    }
                                });
                          } else {
                              setSelectedTurno(turno);
                          }
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <span className={`font-bold text-gray-900 ${turno.estado === 'cancelado' ? 'line-through text-gray-500' : ''}`}>
                            {turno.hora_inicio.slice(0, 5)} - {turno.hora_fin.slice(0, 5)}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          turno.estado === 'cancelado' ? 'bg-gray-200 text-gray-600' :
                          turno.es_fijo ? 'bg-purple-100 text-purple-800' :
                          parseFloat(turno.monto_pagado) >= parseFloat(turno.monto_total) ? 'bg-green-100 text-green-800' : 
                          parseFloat(turno.monto_pagado) > 0 ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {turno.estado === 'cancelado' ? 'Cancelado' :
                           turno.es_fijo ? 'Fijo 🔄' :
                           parseFloat(turno.monto_pagado) >= parseFloat(turno.monto_total) ? 'Pagado' : 
                           parseFloat(turno.monto_pagado) > 0 ? 'Parcial' : 'Pendiente'}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-800 mt-1">{turno.cliente_nombre}</p>
                      <p className="text-xs text-gray-500">{turno.cliente_telefono}</p>
                      <div className="mt-2 text-right">
                        {!turno.es_fijo && <span className="text-xs text-gray-500 block">Pagado: ${formatCurrency(turno.monto_pagado)}</span>}
                        <span className="text-sm font-bold text-indigo-600">Total: ${formatCurrency(turno.monto_total)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedTurno && (
        <PagoModal 
          turno={selectedTurno} 
          onClose={() => setSelectedTurno(null)} 
          onPagoSuccess={() => {
            fetchTurnos();
            setSelectedTurno(null);
          }} 
        />
      )}
    </div>
  );
};

export default TurnoList;
