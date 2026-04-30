import React, { useState, useEffect } from 'react';
import { JugadorService, CategoriaService } from '../services/api';
import CuentaCorrienteModal from './CuentaCorrienteModal';
import { formatCurrency } from '../utils/formatters';
import { alerts } from '../utils/alerts';

const JugadoresPage = () => {
    const [jugadores, setJugadores] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newJugador, setNewJugador] = useState({ nombre: '', telefono: '', email: '', categoria_id: '' });
    const [creating, setCreating] = useState(false);
    const [selectedJugador, setSelectedJugador] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [currentJugadorId, setCurrentJugadorId] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [jugadoresData, categoriasData] = await Promise.all([
                JugadorService.getAll(),
                CategoriaService.getAll()
            ]);
            setJugadores(jugadoresData);
            setCategorias(categoriasData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchJugadores = async (search = '') => {
        setLoading(true);
        try {
            const data = await JugadorService.getAll(search);
            setJugadores(data);
        } catch (error) {
            console.error('Error fetching jugadores:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        const term = e.target.value;
        setSearchTerm(term);
        // Debounce could be added here, but for now direct call is fine or use useEffect on searchTerm
    };

    // Use effect for search debounce or just simple enter key
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchJugadores(searchTerm);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            if (isEditing) {
                await JugadorService.update(currentJugadorId, newJugador);
            } else {
                await JugadorService.create(newJugador);
            }
            setIsModalOpen(false);
            setNewJugador({ nombre: '', telefono: '', email: '', categoria_id: '' });
            setIsEditing(false);
            setCurrentJugadorId(null);
            fetchJugadores(searchTerm);
            alerts.toast('success', isEditing ? 'Jugador actualizado' : 'Jugador creado');
        } catch (error) {
            alerts.error('Error', isEditing ? 'Error al actualizar jugador' : 'Error al crear jugador');
        } finally {
            setCreating(false);
        }
    };

    const handleEdit = (jugador) => {
        setNewJugador({
            nombre: jugador.nombre,
            telefono: jugador.telefono || '',
            email: jugador.email || '',
            categoria_id: jugador.categoria_id || ''
        });
        setCurrentJugadorId(jugador.id);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const openNewJugadorModal = () => {
        setNewJugador({ nombre: '', telefono: '', email: '', categoria_id: '' });
        setIsEditing(false);
        setCurrentJugadorId(null);
        setIsModalOpen(true);
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-xl font-semibold text-gray-900">Jugadores</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Lista de todos los jugadores registrados en el sistema.
                    </p>
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                    <button
                        type="button"
                        onClick={openNewJugadorModal}
                        className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
                    >
                        Agregar Jugador
                    </button>
                </div>
            </div>

            <div className="mt-4">
                <input
                    type="text"
                    placeholder="Buscar por nombre..."
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    value={searchTerm}
                    onChange={handleSearch}
                />
            </div>

            <div className="mt-8 flex flex-col">
                <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                        
                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-4 px-4">
                            {loading ? (
                                <div className="text-center py-4 text-gray-500">Cargando...</div>
                            ) : jugadores.length === 0 ? (
                                <div className="text-center py-4 text-gray-500">No se encontraron jugadores.</div>
                            ) : (
                                jugadores.map((jugador) => (
                                    <div key={jugador.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-lg font-medium text-gray-900">{jugador.nombre}</h3>
                                            <span className={`text-sm font-semibold ${
                                                parseFloat(jugador.saldo) > 0 ? 'text-red-600' : 'text-green-600'
                                            }`}>
                                                ${formatCurrency(jugador.saldo || 0)}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-500 space-y-1 mb-3">
                                            <p>📞 {jugador.telefono || '-'}</p>
                                            <p>✉️ {jugador.email || '-'}</p>
                                            <p>🏷️ {jugador.categoria_descripcion || '-'}</p>
                                        </div>
                                        <div className="flex justify-end space-x-3 pt-2 border-t border-gray-100">
                                            <button 
                                                onClick={() => handleEdit(jugador)}
                                                className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                                            >
                                                Editar
                                            </button>
                                            <button 
                                                onClick={() => setSelectedJugador(jugador)}
                                                className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                                            >
                                                Ver Cuenta
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Nombre</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Teléfono</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Email</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Categoría</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Saldo</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                            <span className="sr-only">Acciones</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="6" className="py-4 text-center text-sm text-gray-500">Cargando...</td>
                                        </tr>
                                    ) : jugadores.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="py-4 text-center text-sm text-gray-500">No se encontraron jugadores.</td>
                                        </tr>
                                    ) : (
                                        jugadores.map((jugador) => (
                                            <tr key={jugador.id}>
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{jugador.nombre}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{jugador.telefono || '-'}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{jugador.email || '-'}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{jugador.categoria_descripcion || '-'}</td>
                                                <td className={`whitespace-nowrap px-3 py-4 text-sm font-semibold ${
                                                    parseFloat(jugador.saldo) > 0 ? 'text-red-600' : 'text-green-600'
                                                }`}>
                                                    ${formatCurrency(jugador.saldo || 0)}
                                                </td>
                                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                    <button 
                                                        onClick={() => handleEdit(jugador)}
                                                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button 
                                                        onClick={() => setSelectedJugador(jugador)}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        Ver Cuenta
                                                    </button>
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

            {/* Modal de Creación */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    {/* ... (Create Player Modal content - unchanged) ... */}
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsModalOpen(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <form onSubmit={handleSubmit}>
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                        {isEditing ? 'Editar Jugador' : 'Nuevo Jugador'}
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Nombre</label>
                                            <input
                                                type="text"
                                                required
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                value={newJugador.nombre}
                                                onChange={e => setNewJugador({ ...newJugador, nombre: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                                            <input
                                                type="text"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                value={newJugador.telefono}
                                                onChange={e => setNewJugador({ ...newJugador, telefono: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <input
                                                type="email"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                value={newJugador.email}
                                                onChange={e => setNewJugador({ ...newJugador, email: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Categoría</label>
                                            <select
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                value={newJugador.categoria_id}
                                                onChange={e => setNewJugador({ ...newJugador, categoria_id: e.target.value })}
                                            >
                                                <option value="">Seleccionar Categoría</option>
                                                {categorias.map(cat => (
                                                    <option key={cat.id} value={cat.id}>{cat.descripcion}</option>
                                                ))}
                                            </select>
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

            {selectedJugador && (
                <CuentaCorrienteModal 
                    jugador={selectedJugador} 
                    onClose={() => {
                        setSelectedJugador(null);
                        fetchJugadores(searchTerm); // Refresh list to update balance
                    }} 
                />
            )}
        </div>
    );
};

export default JugadoresPage;
