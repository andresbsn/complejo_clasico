import React, { useState, useEffect } from 'react';
import api, { TurnoService, JugadorService } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import SearchableSelect from './SearchableSelect';
import { alerts } from '../utils/alerts';

const PagoModal = ({ turno, onClose, onPagoSuccess }) => {
    const saldoPendiente = parseFloat(turno.monto_total) - parseFloat(turno.monto_pagado || 0);
    const [monto, setMonto] = useState(saldoPendiente);
    const [metodo, setMetodo] = useState('efectivo');
    const [observaciones, setObservaciones] = useState('');
    const [loading, setLoading] = useState(false);
    const [showCancelOptions, setShowCancelOptions] = useState(false);
    const [jugadores, setJugadores] = useState([]);
    const [selectedJugadorId, setSelectedJugadorId] = useState(null);

    useEffect(() => {
        const fetchJugadores = async () => {
            try {
                const data = await JugadorService.getAll();
                // Map data to format expected by SearchableSelect if needed, 
                // but SearchableSelect expects objects and uses labelKey/valueKey. 
                // Player objects have 'nombre' and 'id', so it works directly.
                setJugadores(data);
            } catch (error) {
                console.error("Error al cargar jugadores", error);
            }
        };
        fetchJugadores();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (metodo === 'cuenta_corriente' && !selectedJugadorId) {
            alerts.warning('Faltan datos', 'Debe seleccionar un jugador para cargar a cuenta corriente.');
            return;
        }

        setLoading(true);
        try {
            let turnoId = turno.id;

            // Si es un turno fijo, primero lo materializamos como un turno real para esta fecha
            if (turno.id.toString().startsWith('fijo_') || turno.es_fijo) {
                const nuevoTurno = await TurnoService.create({
                    cancha_id: turno.cancha_id,
                    fecha: turno.fecha,
                    hora_inicio: turno.hora_inicio,
                    hora_fin: turno.hora_fin,
                    cliente_nombre: turno.cliente_nombre,
                    cliente_telefono: turno.cliente_telefono,
                    monto_total: turno.monto_total,
                    es_fijo: false // Importante: crearlo como turno normal
                });
                turnoId = nuevoTurno.id;
            }
            
            await api.post(`/turnos/${turnoId}/pagos`, { 
                monto, 
                metodo,
                observaciones: metodo === 'gastos_generales' ? observaciones : null,
                jugador_id: metodo === 'cuenta_corriente' ? selectedJugadorId : null
            });
            onPagoSuccess();
            alerts.toast('success', 'Pago registrado exitosamente');
            onClose();
        } catch (error) {
            console.error('Error al registrar pago:', error);
            alerts.error('Error', 'No se pudo registrar el pago: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        // For fixed turnos, show options
        if (turno.es_fijo || turno.estado === 'fijo') {
            setShowCancelOptions(true);
            return;
        }
        
        // For regular turnos, cancel directly
        const result = await alerts.confirm('¿Cancelar turno?', '¿Está seguro de que desea cancelar este turno?');
        if (!result.isConfirmed) return;
        
        setLoading(true);
        try {
            await TurnoService.updateStatus(turno.id, 'cancelado');
            onPagoSuccess(); // Refresca la lista
            alerts.toast('success', 'Turno cancelado');
            onClose();
        } catch (error) {
            console.error('Error al cancelar turno:', error);
            alerts.error('Error', 'No se pudo cancelar el turno');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelToday = async () => {
        setLoading(true);
        try {
            // Create a cancelled turno for this specific date
            await TurnoService.create({
                cancha_id: turno.cancha_id,
                fecha: turno.fecha,
                hora_inicio: turno.hora_inicio,
                hora_fin: turno.hora_fin,
                cliente_nombre: turno.cliente_nombre,
                cliente_telefono: turno.cliente_telefono,
                monto_total: turno.monto_total,
                estado: 'cancelado'
            });
            setShowCancelOptions(false);
            onPagoSuccess();
            alerts.toast('success', 'Turno cancelado por hoy');
            onClose();
        } catch (error) {
            console.error('Error al cancelar turno:', error);
            alerts.error('Error', 'No se pudo cancelar el turno');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelPermanently = async () => {
        const result = await alerts.confirm('¿Eliminar definitivamente?', '¿Está seguro de eliminar este turno fijo permanentemente? Esta acción no se puede deshacer.');
        if (!result.isConfirmed) return;
        
        setLoading(true);
        try {
            // Extract the real ID from the virtual ID (format: fijo_123)
            const fijoId = turno.id.toString().replace('fijo_', '');
            await api.delete(`/turnos/fijos/${fijoId}`);
            setShowCancelOptions(false);
            onPagoSuccess();
            alerts.toast('success', 'Turno fijo eliminado');
            onClose();
        } catch (error) {
            console.error('Error al eliminar turno fijo:', error);
            alerts.error('Error', 'No se pudo eliminar el turno fijo');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
            <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
                <div className="mt-3">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Registrar Pago</h3>
                    <p className="text-sm text-gray-500 mb-2">
                        Turno: {turno.cancha_nombre} - {turno.hora_inicio}
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg mb-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total Turno:</span>
                            <span className="font-semibold">${formatCurrency(turno.monto_total)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Abonado:</span>
                            <span className="text-green-600 font-semibold">${formatCurrency(turno.monto_pagado || 0)}</span>
                        </div>
                        <div className="flex justify-between text-base border-t pt-2 mt-2">
                            <span className="font-bold text-gray-800">Restante:</span>
                            <span className="font-bold text-red-600">${formatCurrency(saldoPendiente)}</span>
                        </div>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">Monto a Pagar</label>
                            <input
                                type="number"
                                value={monto}
                                onChange={(e) => setMonto(e.target.value)}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                required
                                max={saldoPendiente}
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">Método de Pago</label>
                            <select
                                value={metodo}
                                onChange={(e) => setMetodo(e.target.value)}
                                className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            >
                                <option value="efectivo">Efectivo</option>
                                <option value="transferencia">Transferencia</option>
                                <option value="qr">QR</option>
                                <option value="cuenta_corriente">Cuenta Corriente</option>
                                <option value="gastos_generales">Gastos Generales / Cortesía</option>
                            </select>
                        </div>

                        {metodo === 'cuenta_corriente' && (
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Seleccionar Jugador</label>
                                <SearchableSelect
                                    options={jugadores}
                                    value={selectedJugadorId}
                                    onChange={(option) => setSelectedJugadorId(option.id)}
                                    labelKey="nombre"
                                    valueKey="id"
                                    placeholder="Buscar jugador..."
                                />
                                <p className="text-xs text-gray-500 mt-1">El monto se cargará como deuda a este jugador.</p>
                            </div>
                        )}

                        {metodo === 'gastos_generales' && (
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Motivo / Observación</label>
                                <textarea
                                    value={observaciones}
                                    onChange={(e) => setObservaciones(e.target.value)}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    rows="2"
                                    placeholder="Ej: Ausencia rival, cortesía, etc."
                                />
                            </div>
                        )}
                        <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm"
                                >
                                    Cerrar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm"
                                    disabled={loading}
                                >
                                    {loading ? 'Procesando...' : 'Pagar'}
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="w-full bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm"
                                disabled={loading}
                            >
                                Cancelar Turno
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Cancel Options Modal for Fixed Turnos */}
            {showCancelOptions && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cancelar Turno Fijo</h3>
                        <p className="text-sm text-gray-600 mb-6">
                            Este es un turno fijo que se repite semanalmente. ¿Cómo deseas cancelarlo?
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={handleCancelToday}
                                disabled={loading}
                                className="w-full py-3 px-4 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                            >
                                Cancelar solo por hoy
                            </button>
                            <button
                                onClick={handleCancelPermanently}
                                disabled={loading}
                                className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                            >
                                Cancelar definitivamente
                            </button>
                            <button
                                onClick={() => setShowCancelOptions(false)}
                                disabled={loading}
                                className="w-full py-2 px-4 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50"
                            >
                                Volver
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PagoModal;
