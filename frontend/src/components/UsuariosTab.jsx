import React, { useState, useEffect } from 'react';
import { UserService } from '../services/api';
import { alerts } from '../utils/alerts';

const UsuariosTab = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Form State
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [nombre, setNombre] = useState('');
    const [rol, setRol] = useState('user');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await UserService.getAll();
            setUsers(data);
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await UserService.create({ username, password, nombre, rol });
            // Reset form
            setUsername('');
            setPassword('');
            setNombre('');
            setRol('user');
            // Reload list
            fetchUsers();
            alerts.success('Usuario creado', 'El nuevo usuario ha sido registrado exitosamente.');
        } catch (error) {
            console.error('Error creating user:', error);
            alerts.error('Error', 'No se pudo crear el usuario: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleDelete = async (id) => {
        const result = await alerts.confirm('¿Eliminar usuario?', '¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.');
        if (result.isConfirmed) {
            try {
                await UserService.delete(id);
                alerts.toast('success', 'Usuario eliminado');
                fetchUsers();
            } catch (error) {
                console.error('Error deleting user:', error);
                alerts.error('Error', 'No se pudo eliminar el usuario');
            }
        }
    };

    return (
        <div className="space-y-8">
            {/* Create User Form */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Crear Nuevo Usuario</h3>
                <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-6" autoComplete="off">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                        <input
                            type="text" required
                            autoComplete="off"
                            value={nombre} onChange={(e) => setNombre(e.target.value)}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm py-2 px-3 border"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Usuario (Login)</label>
                        <input
                            type="text" required
                            autoComplete="off"
                            value={username} onChange={(e) => setUsername(e.target.value)}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm py-2 px-3 border"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                        <input
                            type="password" required
                            autoComplete="new-password"
                            value={password} onChange={(e) => setPassword(e.target.value)}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm py-2 px-3 border"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                        <select
                            value={rol} onChange={(e) => setRol(e.target.value)}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm py-2 px-3 border"
                        >
                            <option value="user">Usuario (Cajero/Operador)</option>
                            <option value="admin">Administrador</option>
                        </select>
                    </div>
                    <div className="md:col-span-2 flex justify-end">
                        <button
                            type="submit"
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Crear Usuario
                        </button>
                    </div>
                </form>
            </div>

            {/* Users List */}
            {/* Mobile Cards View */}
            <div className="md:hidden space-y-4">
                {users.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">No se encontraron usuarios.</div>
                ) : (
                    users.map((u) => (
                        <div key={u.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-semibold text-gray-900">{u.nombre}</h3>
                                    <p className="text-xs text-gray-500">@{u.username}</p>
                                </div>
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.rol === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                                    {u.rol}
                                </span>
                            </div>
                            <div className="flex justify-end pt-3 border-t border-gray-100 mt-2">
                                <button 
                                    onClick={() => handleDelete(u.id)}
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
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Usuarios del Sistema</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-gray-50 text-sm">
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{u.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{u.nombre}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{u.username}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.rol === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                                            {u.rol}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button 
                                            onClick={() => handleDelete(u.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UsuariosTab;
