import React, { useState, useEffect } from 'react';
import { ConfiguracionService } from '../services/api';
import UsuariosTab from './UsuariosTab';
import { alerts } from '../utils/alerts';

const ConfiguracionPage = () => {
    const [activeTab, setActiveTab] = useState('general');

    // Config State
    const [config, setConfig] = useState({
        PRECIO_PADEL: '',
        PRECIO_PADEL_FIJO: '',
        PRECIO_FUTBOL: '',
        DURACION_PADEL: '',
        DURACION_FUTBOL: '',
        HORARIO_APERTURA: '',
        HORARIO_CIERRE: ''
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (activeTab === 'general') {
            fetchConfig();
        }
    }, [activeTab]);

    const fetchConfig = async () => {
        try {
            const data = await ConfiguracionService.getAll();
            setConfig(data);
        } catch (error) {
            console.error('Error al cargar configuración:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setConfig({
            ...config,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await ConfiguracionService.update('PRECIO_PADEL', config.PRECIO_PADEL);
            await ConfiguracionService.update('PRECIO_PADEL_FIJO', config.PRECIO_PADEL_FIJO);
            await ConfiguracionService.update('PRECIO_FUTBOL', config.PRECIO_FUTBOL);
            await ConfiguracionService.update('DURACION_PADEL', config.DURACION_PADEL);
            await ConfiguracionService.update('DURACION_FUTBOL', config.DURACION_FUTBOL);
            await ConfiguracionService.update('HORARIO_APERTURA', config.HORARIO_APERTURA);
            await ConfiguracionService.update('HORARIO_CIERRE', config.HORARIO_CIERRE);
            alerts.success('¡Guardado!', 'La configuración se actualizó correctamente.');
        } catch (error) {
            console.error('Error al guardar configuración:', error);
            alerts.error('Error', 'No se pudieron guardar los cambios.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Panel de Configuración</h2>
            
            {/* Tabs Navigation */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'general'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        General (Precios y Horarios)
                    </button>
                    <button
                        onClick={() => setActiveTab('usuarios')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'usuarios'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Usuarios y Permisos
                    </button>
                </nav>
            </div>

            {/* General Settings Tab */}
            {activeTab === 'general' && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    {loading && !config.PRECIO_PADEL ? (
                        <div>Cargando configuración...</div>
                    ) : (
                        <>
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Precios */}
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Precios por Turno</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Cancha de Padel</label>
                                                <div className="relative rounded-md shadow-sm">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <span className="text-gray-500 sm:text-sm">$</span>
                                                    </div>
                                                    <input
                                                        type="number"
                                                        name="PRECIO_PADEL"
                                                        value={config.PRECIO_PADEL || ''}
                                                        onChange={handleChange}
                                                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Cancha de Padel (Turno Fijo)</label>
                                                <div className="relative rounded-md shadow-sm">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <span className="text-gray-500 sm:text-sm">$</span>
                                                    </div>
                                                    <input
                                                        type="number"
                                                        name="PRECIO_PADEL_FIJO"
                                                        value={config.PRECIO_PADEL_FIJO || ''}
                                                        onChange={handleChange}
                                                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Cancha de Fútbol</label>
                                                <div className="relative rounded-md shadow-sm">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <span className="text-gray-500 sm:text-sm">$</span>
                                                    </div>
                                                    <input
                                                        type="number"
                                                        name="PRECIO_FUTBOL"
                                                        value={config.PRECIO_FUTBOL || ''}
                                                        onChange={handleChange}
                                                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Duración */}
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Duración (minutos)</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Padel</label>
                                                <input
                                                    type="number"
                                                    name="DURACION_PADEL"
                                                    value={config.DURACION_PADEL || ''}
                                                    onChange={handleChange}
                                                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Fútbol</label>
                                                <input
                                                    type="number"
                                                    name="DURACION_FUTBOL"
                                                    value={config.DURACION_FUTBOL || ''}
                                                    onChange={handleChange}
                                                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Horarios */}
                                    <div className="md:col-span-2">
                                        <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Horarios del Complejo</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Horario Apertura</label>
                                                <input
                                                    type="time"
                                                    name="HORARIO_APERTURA"
                                                    value={config.HORARIO_APERTURA || ''}
                                                    onChange={handleChange}
                                                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Horario Cierre</label>
                                                <input
                                                    type="time"
                                                    name="HORARIO_CIERRE"
                                                    value={config.HORARIO_CIERRE || ''}
                                                    onChange={handleChange}
                                                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                    >
                                        {loading ? 'Guardando...' : 'Guardar Cambios'}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            )}

            {/* Users Settings Tab */}
            {activeTab === 'usuarios' && (
                <UsuariosTab />
            )}
        </div>
    );
};

export default ConfiguracionPage;
