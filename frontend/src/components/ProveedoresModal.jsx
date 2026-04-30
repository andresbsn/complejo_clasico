import React, { useState, useEffect } from 'react';
import { ProveedorService } from '../services/api';
import { alerts } from '../utils/alerts';

const ProveedoresModal = ({ onClose }) => {
    const [proveedores, setProveedores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ nombre: '', contacto: '', telefono: '', email: '' });

    useEffect(() => {
        fetchProveedores();
    }, []);

    const fetchProveedores = async () => {
        setLoading(true);
        try {
            const data = await ProveedorService.getAll();
            setProveedores(data);
        } catch (error) {
            console.error('Error fetching proveedores:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await ProveedorService.update(editingId, formData);
            } else {
                await ProveedorService.create(formData);
                alerts.toast('success', 'Proveedor creado');
            }
            setFormData({ nombre: '', contacto: '', telefono: '', email: '' });
            setEditingId(null);
            fetchProveedores();
        } catch (error) {
            alerts.error('Error', 'No se pudo guardar el proveedor');
        }
    };

    const handleEdit = (prov) => {
        setEditingId(prov.id);
        setFormData({ 
            nombre: prov.nombre, 
            contacto: prov.contacto || '', 
            telefono: prov.telefono || '', 
            email: prov.email || '' 
        });
    };

    const handleDelete = async (id) => {
        const result = await alerts.confirm('¿Eliminar proveedor?', '¿Estás seguro de que deseas eliminar este proveedor? Esta acción no se puede deshacer.');
        if (!result.isConfirmed) return;
        try {
            await ProveedorService.delete(id);
            alerts.toast('success', 'Proveedor eliminado');
            fetchProveedores();
        } catch (error) {
            alerts.error('Error', 'No se pudo eliminar el proveedor. Es posible que tenga movimientos asociados.');
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="relative mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900">Gestión de Proveedores</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500 text-2xl">✕</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Formulario */}
                    <div className="md:col-span-1 bg-gray-50 p-4 rounded-lg h-fit">
                        <h4 className="text-sm font-semibold mb-3">{editingId ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h4>
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <input 
                                type="text" placeholder="Empresa / Nombre" required
                                value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                                className="w-full border rounded p-2 text-sm"
                            />
                            <input 
                                type="text" placeholder="Nombre Contacto" 
                                value={formData.contacto} onChange={(e) => setFormData({...formData, contacto: e.target.value})}
                                className="w-full border rounded p-2 text-sm"
                            />
                            <input 
                                type="text" placeholder="Teléfono" 
                                value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                                className="w-full border rounded p-2 text-sm"
                            />
                            <input 
                                type="email" placeholder="Email" 
                                value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                                className="w-full border rounded p-2 text-sm"
                            />
                            <div className="flex gap-2 pt-2">
                                <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded text-sm hover:bg-indigo-700">
                                    {editingId ? 'Actualizar' : 'Crear'}
                                </button>
                                {editingId && (
                                    <button 
                                        type="button" 
                                        onClick={() => { setEditingId(null); setFormData({ nombre: '', contacto: '', telefono: '', email: '' }); }}
                                        className="bg-gray-200 text-gray-800 px-3 py-2 rounded text-sm hover:bg-gray-300"
                                    >
                                        Cancelar
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Lista */}
                    <div className="md:col-span-2 overflow-y-auto max-h-[60vh]">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100 sticky top-0">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Nombre</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Contacto</th>
                                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {loading ? (
                                    <tr><td colSpan="3" className="text-center py-4">Cargando...</td></tr>
                                ) : proveedores.length === 0 ? (
                                    <tr><td colSpan="3" className="text-center py-4 text-gray-500">No hay proveedores.</td></tr>
                                ) : (
                                    proveedores.map(prov => (
                                        <tr key={prov.id} className="hover:bg-gray-50">
                                            <td className="px-3 py-2 text-sm font-medium text-gray-900">{prov.nombre}</td>
                                            <td className="px-3 py-2 text-sm text-gray-500">
                                                <div className="flex flex-col">
                                                    <span>{prov.contacto}</span>
                                                    <span className="text-xs text-gray-400">{prov.telefono}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 text-right text-sm space-x-2">
                                                <button onClick={() => handleEdit(prov)} className="text-indigo-600 hover:text-indigo-900">Editar</button>
                                                <button onClick={() => handleDelete(prov.id)} className="text-red-600 hover:text-red-900">Eliminar</button>
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
    );
};

export default ProveedoresModal;
