import React, { useState, useEffect } from 'react';
import { ProveedorService, CompraService } from '../services/api'; // Added CompraService
import CuentaProveedorModal from './CuentaProveedorModal';
import CompraForm from './CompraForm';
import { formatCurrency } from '../utils/formatters';
import { alerts } from '../utils/alerts';

const ProveedoresPage = () => {
    const [activeTab, setActiveTab] = useState('proveedores'); // 'proveedores', 'compras'
    const [proveedores, setProveedores] = useState([]);
    const [compras, setCompras] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal & Form States
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isCompraFormOpen, setIsCompraFormOpen] = useState(false);
    
    const [editingProvider, setEditingProvider] = useState(null);
    const [editingCompra, setEditingCompra] = useState(null);
    
    const [selectedProviderForAccount, setSelectedProviderForAccount] = useState(null);

    const [formData, setFormData] = useState({ 
        nombre: '', contacto: '', telefono: '', email: '' 
    });

    useEffect(() => {
        if (activeTab === 'proveedores') {
            fetchProveedores();
        } else {
            fetchCompras();
            fetchProveedores(); // Need providers for purchase form
        }
    }, [activeTab]);

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

    const fetchCompras = async () => {
        setLoading(true);
        try {
            const data = await CompraService.getAll();
            setCompras(data);
        } catch (error) {
             console.error('Error fetching compras:', error);
        } finally {
             setLoading(false);
        }
    };

    const handleEdit = (prov) => {
        setEditingProvider(prov);
        setFormData({
            nombre: prov.nombre,
            contacto: prov.contacto || '',
            telefono: prov.telefono || '',
            email: prov.email || ''
        });
        setIsFormOpen(true);
    };

    const handleDelete = async (id) => {
        const result = await alerts.confirm('¿Eliminar proveedor?', '¿Estás seguro de que deseas eliminar este proveedor? Esta acción no se puede deshacer si tiene movimientos.');
        if (!result.isConfirmed) return;
        try {
            await ProveedorService.delete(id);
            alerts.toast('success', 'Proveedor eliminado');
            fetchProveedores();
        } catch (error) {
            alerts.error('Error', 'No se pudo eliminar el proveedor');
        }
    };
    
    const handleDeleteCompra = async (id) => {
        const result = await alerts.confirm('¿Eliminar compra?', '¿Estás seguro de que deseas eliminar esta compra? Se revertirá la deuda asociada.');
        if (!result.isConfirmed) return;
        try {
            await CompraService.delete(id);
            alerts.toast('success', 'Compra eliminada');
            fetchCompras();
        } catch (error) {
            alerts.error('Error', 'No se pudo eliminar la compra: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingProvider) {
                await ProveedorService.update(editingProvider.id, formData);
                alerts.toast('success', 'Proveedor actualizado');
            } else {
                await ProveedorService.create(formData);
                alerts.toast('success', 'Proveedor creado');
            }
            setIsFormOpen(false);
            setEditingProvider(null);
            setFormData({ nombre: '', contacto: '', telefono: '', email: '' });
            fetchProveedores();
        } catch (error) {
            alerts.error('Error', 'Error al guardar proveedor');
        }
    };
    
    const handleEditCompra = async (id) => {
        try {
            const compra = await CompraService.getById(id);
            setEditingCompra(compra);
            setIsCompraFormOpen(true);
        } catch(e) {
            alerts.error('Error', 'No se pudo cargar la información de la compra');
        }
    };

    const filteredProveedores = proveedores.filter(p => 
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.contacto && p.contacto.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const filteredCompras = compras.filter(c => 
        c.proveedor_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id.toString().includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Sección Proveedores</h2>
                    <p className="text-gray-500 text-sm">Gestión de proveedores, cuentas y órdenes de compra</p>
                </div>
                <div className="space-x-2">
                     <button 
                        onClick={() => { setEditingProvider(null); setFormData({ nombre: '', contacto: '', telefono: '', email: '' }); setIsFormOpen(true); }}
                        className="bg-white border border-indigo-600 text-indigo-600 px-4 py-2 rounded-lg font-medium hover:bg-indigo-50 shadow-sm"
                    >
                        + Nuevo Proveedor
                    </button>
                    <button 
                        onClick={() => { setEditingCompra(null); setIsCompraFormOpen(true); }}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 shadow-sm"
                    >
                        + Nueva Orden de Compra
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('proveedores')}
                        className={`${activeTab === 'proveedores' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                         Listado de Proveedores
                    </button>
                    <button
                         onClick={() => setActiveTab('compras')}
                        className={`${activeTab === 'compras' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Ordenes de Compra
                    </button>
                </nav>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <input
                    type="text"
                    placeholder={activeTab === 'proveedores' ? "🔍 Buscar proveedor por nombre o contacto..." : "🔍 Buscar compra por ID o proveedor..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>

            {/* Content */}
            {activeTab === 'proveedores' ? (
                 <>
                    {/* Mobile Cards for Proveedores */}
                    <div className="md:hidden space-y-4">
                        {loading && proveedores.length === 0 ? (
                            <div className="text-center py-4 text-gray-500">Cargando proveedores...</div>
                        ) : filteredProveedores.length === 0 ? (
                            <div className="text-center py-4 text-gray-500">No se encontraron proveedores.</div>
                        ) : (
                            filteredProveedores.map((prov) => (
                                <div key={prov.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{prov.nombre}</h3>
                                            <span className="text-xs text-gray-400">ID: {prov.id}</span>
                                        </div>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            parseFloat(prov.saldo) > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                        }`}>
                                            ${formatCurrency(prov.saldo || 0)}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-600 space-y-1 mb-3">
                                        {prov.contacto && <p>👤 {prov.contacto}</p>}
                                        {prov.email && <p>✉️ {prov.email}</p>}
                                        {prov.telefono && <p>📞 {prov.telefono}</p>}
                                    </div>
                                    <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                                        <button 
                                            onClick={() => setSelectedProviderForAccount(prov)}
                                            className="flex-1 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-indigo-100"
                                        >
                                            Ver Cuenta
                                        </button>
                                        <button 
                                            onClick={() => handleEdit(prov)}
                                            className="flex-1 bg-gray-50 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-100"
                                        >
                                            Editar
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(prov.id)}
                                            className="flex-1 bg-red-50 text-red-700 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-red-100"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Desktop Table for Proveedores */}
                    <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto / Detalles</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo (Deuda)</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading && proveedores.length === 0 ? (
                                        <tr><td colSpan="4" className="text-center py-8">Cargando proveedores...</td></tr>
                                    ) : filteredProveedores.length === 0 ? (
                                        <tr><td colSpan="4" className="text-center py-8 text-gray-500">No se encontraron proveedores.</td></tr>
                                    ) : (
                                        filteredProveedores.map((prov) => (
                                            <tr key={prov.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{prov.nombre}</div>
                                                    <div className="text-xs text-gray-400">ID: {prov.id}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{prov.contacto || '-'}</div>
                                                    <div className="text-xs text-gray-500">{prov.email}</div>
                                                    <div className="text-xs text-gray-500">{prov.telefono}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {/* Saldo logic: Positive = We Owe */}
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        parseFloat(prov.saldo) > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                    }`}>
                                                        ${formatCurrency(prov.saldo || 0)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                                    <button 
                                                        onClick={() => setSelectedProviderForAccount(prov)}
                                                        className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded-md"
                                                    >
                                                        Ver Cuenta
                                                    </button>
                                                    <button 
                                                        onClick={() => handleEdit(prov)}
                                                        className="text-gray-600 hover:text-gray-900"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(prov.id)}
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
                 </>
            ) : (
                // COMPRAS TAB
                <>
                    {/* Mobile Cards for Compras */}
                    <div className="md:hidden space-y-4">
                        {loading && compras.length === 0 ? (
                            <div className="text-center py-4 text-gray-500">Cargando compras...</div>
                        ) : filteredCompras.length === 0 ? (
                            <div className="text-center py-4 text-gray-500">No se encontraron compras.</div>
                        ) : (
                            filteredCompras.map((compra) => (
                                <div key={compra.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">Compra #{compra.id}</h3>
                                            <p className="text-xs text-gray-500">{new Date(compra.fecha).toLocaleDateString()}</p>
                                        </div>
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            compra.estado === 'RECIBIDO' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {compra.estado}
                                        </span>
                                    </div>
                                    <div className="mb-3">
                                        <p className="text-sm text-gray-600">Proveedor: <span className="font-medium text-gray-900">{compra.proveedor_nombre}</span></p>
                                        <p className="text-lg font-bold text-gray-900 mt-1">${formatCurrency(compra.total)}</p>
                                    </div>
                                    <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                                        <button 
                                            onClick={() => handleEditCompra(compra.id)}
                                            className="text-indigo-600 hover:text-indigo-900 font-medium text-sm"
                                        >
                                            Ver / Editar
                                        </button>
                                        {compra.estado === 'PENDIENTE' && (
                                            <button 
                                                onClick={() => handleDeleteCompra(compra.id)}
                                                className="text-red-600 hover:text-red-900 font-medium text-sm ml-3"
                                            >
                                                Eliminar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Desktop Table for Compras */}
                    <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading && compras.length === 0 ? (
                                        <tr><td colSpan="6" className="text-center py-8">Cargando compras...</td></tr>
                                    ) : filteredCompras.length === 0 ? (
                                        <tr><td colSpan="6" className="text-center py-8 text-gray-500">No se encontraron compras.</td></tr>
                                    ) : (
                                        filteredCompras.map((compra) => (
                                            <tr key={compra.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{compra.id}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(compra.fecha).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{compra.proveedor_nombre}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">${formatCurrency(compra.total)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                        compra.estado === 'RECIBIDO' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {compra.estado}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                                    <button 
                                                        onClick={() => handleEditCompra(compra.id)}
                                                        className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded-md"
                                                    >
                                                        ver / Editar
                                                    </button>
                                                    {compra.estado === 'PENDIENTE' && (
                                                        <button 
                                                            onClick={() => handleDeleteCompra(compra.id)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* Create/Edit Provider Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
                    <div className="relative mx-auto p-6 border w-full max-w-lg shadow-lg rounded-xl bg-white">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                            {editingProvider ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                        </h3>
                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nombre Empresa / Proveedor</label>
                                <input 
                                    type="text" required
                                    value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nombre Contacto</label>
                                <input 
                                    type="text" 
                                    value={formData.contacto} onChange={(e) => setFormData({...formData, contacto: e.target.value})}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                                <input 
                                    type="text" 
                                    value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input 
                                    type="email" 
                                    value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                            
                            <div className="flex justify-end gap-3 pt-4">
                                <button 
                                    type="button" 
                                    onClick={() => setIsFormOpen(false)}
                                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Compra Form Modal */}
            {isCompraFormOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 px-4 py-8">
                     <div className="relative mx-auto w-full max-w-4xl shadow-lg rounded-xl bg-white max-h-full overflow-y-auto">
                        <CompraForm 
                            onCompraSaved={() => {
                                setIsCompraFormOpen(false);
                                fetchCompras();
                                if(activeTab === 'proveedores') fetchProveedores(); // Refresh debts if added
                            }}
                            onCancel={() => setIsCompraFormOpen(false)}
                            proveedores={proveedores}
                            initialData={editingCompra}
                        />
                     </div>
                </div>
            )}

            {/* Account Info Modal */}
            {selectedProviderForAccount && (
                <CuentaProveedorModal 
                    proveedor={selectedProviderForAccount} 
                    onClose={() => {
                        setSelectedProviderForAccount(null);
                        fetchProveedores(); // Refresh to update saldo
                    }}
                />
            )}
        </div>
    );
};

export default ProveedoresPage;
