import React, { useState, useEffect } from 'react';
import { CanchaService } from '../services/api';
import { alerts } from '../utils/alerts';

const CanchaList = () => {
    const [canchas, setCanchas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchCanchas();
    }, []);

    const fetchCanchas = async () => {
        try {
            const data = await CanchaService.getAll();
            setCanchas(data);
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await alerts.confirm('¿Eliminar cancha?', '¿Estás seguro de eliminar esta cancha?');
        if (!result.isConfirmed) return;

        try {
            await CanchaService.delete(id); 
            fetchCanchas(); // Recargar la lista
            alerts.toast('success', 'Cancha eliminada');
        } catch (err) {
            alerts.error('Error', err.response?.data?.error || err.message);
        }
    };

    if (loading) return <div>Cargando canchas...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {canchas.map((cancha) => (
                    <div key={cancha.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                        <div className="p-5">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">{cancha.nombre}</h3>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
                                        {cancha.tipo}
                                    </span>
                                </div>
                                <div className="bg-gray-100 p-2 rounded-lg">
                                    <span className="text-2xl">⚽</span>
                                </div>
                            </div>
                            <div className="mt-4 flex justify-end">
                                <button 
                                    onClick={() => handleDelete(cancha.id)}
                                    className="text-sm text-red-600 hover:text-red-900 font-medium transition-colors"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CanchaList;
