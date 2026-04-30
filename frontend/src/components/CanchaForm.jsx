import React, { useState, useEffect } from 'react';
import { CanchaService } from '../services/api';
import { alerts } from '../utils/alerts';

const CanchaForm = ({ onCanchaAdded, defaultType = 'PADEL', onClose }) => {
    const [nombre, setNombre] = useState('');
    const [tipo, setTipo] = useState(defaultType.toLowerCase());
    const [loading, setLoading] = useState(false);

    // Update tipo if defaultType changes
    useEffect(() => {
        if (defaultType) {
            setTipo(defaultType.toLowerCase());
        }
    }, [defaultType]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await CanchaService.create({ 
                nombre, 
                tipo: tipo.toUpperCase()
            });

            setNombre('');
            alerts.toast('success', `Cancha "${nombre}" creada exitosamente`);
            if (onCanchaAdded) onCanchaAdded();
        } catch (err) {
            alerts.error('Error', err.response?.data?.error || 'No se pudo crear la cancha');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-1">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Agregar Nueva Cancha</h3>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="nombre">
                        Nombre de la Cancha
                    </label>
                    <input
                        id="nombre"
                        type="text"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5"
                        placeholder="Ej: Cancha 1"
                        required
                        autoComplete="off"
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="tipo">
                        Tipo
                    </label>
                    <select
                        id="tipo"
                        value={tipo}
                        onChange={(e) => setTipo(e.target.value)}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5"
                    >
                        <option value="padel">Padel</option>
                        <option value="futbol">Fútbol</option>
                    </select>
                </div>
                <div className="flex items-center justify-end space-x-3">
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Cancelar
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Guardando...' : 'Guardar Cancha'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CanchaForm;
