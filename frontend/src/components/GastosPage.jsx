import React, { useState, useEffect } from 'react';
import { GastoService } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import { alerts } from '../utils/alerts';

const GastosPage = () => {
    const [gastos, setGastos] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Form state
    const [descripcion, setDescripcion] = useState('');
    const [monto, setMonto] = useState('');

    useEffect(() => {
        fetchGastos();
    }, []);

    const fetchGastos = async () => {
        setLoading(true);
        try {
            const data = await GastoService.getAll();
            setGastos(data);
        } catch (error) {
            console.error('Error fetching gastos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!descripcion || !monto) {
            alerts.warning('Datos incompletos', 'Debes completar la descripción y el monto.');
            return;
        }

        try {
            await GastoService.create({ descripcion, monto: parseFloat(monto) });
            alerts.toast('success', 'Gasto registrado correctamente');
            setDescripcion('');
            setMonto('');
            fetchGastos();
        } catch (err) {
            alerts.error('Error', err.response?.data?.error || 'Error al registrar el gasto');
        }
    };

    const handleDelete = async (id) => {
        const result = await alerts.confirm('¿Eliminar gasto?', '¿Estás seguro de que deseas eliminar este registro de gasto?');
        if (!result.isConfirmed) return;
        try {
            await GastoService.delete(id);
            alerts.toast('success', 'Gasto eliminado');
            fetchGastos();
        } catch (err) {
            alerts.error('Error', 'No se pudo eliminar el gasto');
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Gastos Generales</h2>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Registrar Nuevo Gasto</h3>
                <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                        <input
                            type="text"
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Ej: Limpieza, Luz, etc."
                        />
                    </div>
                    <div className="w-full md:w-48">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
                        <div className="relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">$</span>
                            </div>
                            <input
                                type="number"
                                value={monto}
                                onChange={(e) => setMonto(e.target.value)}
                                className="pl-7 w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 font-medium whitespace-nowrap"
                    >
                        Registrar Gasto
                    </button>
                </form>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden space-y-4">
                {loading ? (
                    <div className="text-center py-4 text-gray-500">Cargando gastos...</div>
                ) : gastos.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">No hay gastos registrados.</div>
                ) : (
                    gastos.map((gasto) => (
                        <div key={gasto.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="text-base font-semibold text-gray-900">{gasto.descripcion}</h4>
                                    <p className="text-xs text-gray-500 mt-1">{new Date(gasto.fecha).toLocaleDateString()}</p>
                                </div>
                                <span className="text-red-600 font-bold text-sm">
                                    -${formatCurrency(gasto.monto)}
                                </span>
                            </div>
                            <div className="text-sm text-gray-600 mb-3">
                                <span className="text-gray-400 text-xs">Registrado por:</span> {gasto.usuario_nombre || '-'}
                            </div>
                            <div className="flex justify-end pt-3 border-t border-gray-100">
                                <button
                                    onClick={() => handleDelete(gasto.id)}
                                    className="text-red-600 hover:text-red-900 text-sm font-medium flex items-center gap-1"
                                >
                                    <span>🗑</span> Eliminar
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Registrado Por</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan="5" className="text-center py-8">Cargando gastos...</td></tr>
                        ) : gastos.length === 0 ? (
                            <tr><td colSpan="5" className="text-center py-8 text-gray-500">No hay gastos registrados.</td></tr>
                        ) : (
                            gastos.map((gasto) => (
                                <tr key={gasto.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(gasto.fecha).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {gasto.descripcion}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                                        {gasto.usuario_nombre || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-bold text-right">
                                        -${formatCurrency(gasto.monto)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium hidden md:table-cell">
                                        <button 
                                            onClick={() => handleDelete(gasto.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default GastosPage;
