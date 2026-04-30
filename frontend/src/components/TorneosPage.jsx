import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TorneoService } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import { alerts } from '../utils/alerts';

const TorneosPage = () => {
    const [torneos, setTorneos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTorneo, setNewTorneo] = useState({ 
        descripcion: '', 
        fecha_inicio: '', 
        costo_inscripcion: '' 
    });
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchTorneos();
    }, []);

    const fetchTorneos = async () => {
        setLoading(true);
        try {
            const data = await TorneoService.getAll();
            setTorneos(data);
        } catch (error) {
            console.error('Error fetching torneos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            await TorneoService.create(newTorneo);
            setIsModalOpen(false);
            setNewTorneo({ descripcion: '', fecha_inicio: '', costo_inscripcion: '' });
            fetchTorneos();
            alerts.toast('success', 'Torneo creado exitosamente');
        } catch (error) {
            alerts.error('Error', 'No se pudo crear el torneo');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-auto">
                    <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Torneos</h1>
                    <p className="mt-1 md:mt-2 text-xs md:text-sm text-gray-700">
                        Gestión de torneos y competencias.
                    </p>
                </div>
                <div className="sm:flex-none">
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="w-full sm:w-auto inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        Nuevo Torneo
                    </button>
                </div>
            </div>

            <div className="mt-8 flex flex-col">
                {/* Mobile Cards View */}
                <div className="md:hidden space-y-4">
                    {loading ? (
                        <div className="text-center text-sm text-gray-500 py-4">Cargando...</div>
                    ) : torneos.length === 0 ? (
                        <div className="text-center text-sm text-gray-500 py-4">No hay torneos registrados.</div>
                    ) : (
                        torneos.map((torneo) => (
                            <div key={torneo.id} className="bg-white shadow rounded-lg p-4 border border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900 mb-2">{torneo.descripcion}</h3>
                                <div className="text-sm text-gray-500 mb-4">
                                    <p>Fecha Inicio: {new Date(torneo.fecha_inicio).toLocaleDateString()}</p>
                                    <p>Costo: ${formatCurrency(torneo.costo_inscripcion)}</p>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-center mb-4">
                                    <div className="bg-gray-50 p-2 rounded">
                                        <span className="block text-xs text-gray-500">Inscriptos</span>
                                        <span className="block font-semibold text-gray-900">{torneo.cantidad_inscriptos || 0}</span>
                                    </div>
                                    <div className="bg-green-50 p-2 rounded">
                                        <span className="block text-xs text-green-700">Pagados</span>
                                        <span className="block font-semibold text-green-700">{torneo.cantidad_pagados || 0}</span>
                                    </div>
                                    <div className="bg-red-50 p-2 rounded">
                                        <span className="block text-xs text-red-700">Faltan</span>
                                        <span className="block font-semibold text-red-700">{torneo.cantidad_impagos || 0}</span>
                                    </div>
                                </div>
                                <Link 
                                    to={`/torneos/${torneo.id}`}
                                    className="block w-full text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                                >
                                    Ver Detalle
                                </Link>
                            </div>
                        ))
                    )}
                </div>

                <div className="hidden md:block -my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Descripción</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Fecha Inicio</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Inscriptos</th>
                                        {/* <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Abandonaron</th> */}
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Pagados</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Faltan Pagar</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Costo Inscripción</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                            <span className="sr-only">Acciones</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="8" className="py-4 text-center text-sm text-gray-500">Cargando...</td>
                                        </tr>
                                    ) : torneos.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="py-4 text-center text-sm text-gray-500">No hay torneos registrados.</td>
                                        </tr>
                                    ) : (
                                        torneos.map((torneo) => (
                                            <tr key={torneo.id}>
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{torneo.descripcion}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {new Date(torneo.fecha_inicio).toLocaleDateString()}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{torneo.cantidad_inscriptos || 0}</td>
                                                {/* <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{torneo.cantidad_abandonos || 0}</td> */}
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-green-600 font-medium">{torneo.cantidad_pagados || 0}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-red-600 font-medium">{torneo.cantidad_impagos || 0}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">${formatCurrency(torneo.costo_inscripcion)}</td>
                                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                    <Link 
                                                        to={`/torneos/${torneo.id}`}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        Ver Detalle
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsModalOpen(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <form onSubmit={handleSubmit}>
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Nuevo Torneo</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Descripción</label>
                                            <input
                                                type="text"
                                                required
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                value={newTorneo.descripcion}
                                                onChange={e => setNewTorneo({ ...newTorneo, descripcion: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Fecha Inicio</label>
                                            <input
                                                type="date"
                                                required
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                value={newTorneo.fecha_inicio}
                                                onChange={e => setNewTorneo({ ...newTorneo, fecha_inicio: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Costo Inscripción</label>
                                            <input
                                                type="number"
                                                required
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                value={newTorneo.costo_inscripcion}
                                                onChange={e => setNewTorneo({ ...newTorneo, costo_inscripcion: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="submit"
                                        disabled={creating}
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                    >
                                        {creating ? 'Guardando...' : 'Guardar'}
                                    </button>
                                    <button
                                        type="button"
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                        onClick={() => setIsModalOpen(false)}
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TorneosPage;
