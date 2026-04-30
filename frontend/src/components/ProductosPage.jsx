import React, { useState, useEffect } from 'react';
import ProductoList from './ProductoList';
import ProductoForm from './ProductoForm';
import { ProductoService, ProveedorService } from '../services/api';
import { alerts } from '../utils/alerts';

const ProductosPage = () => {
    // Data State
    const [productos, setProductos] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategoria, setFilterCategoria] = useState('');
    const [filterProveedor, setFilterProveedor] = useState('');
    const [filterEstado, setFilterEstado] = useState('ACTIVO'); // Default active

    // Modal State
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [productToEdit, setProductToEdit] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [prodData, provData] = await Promise.all([
                ProductoService.getAll(),
                ProveedorService.getAll()
            ]);
            setProductos(prodData);
            setProveedores(provData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (product) => {
        setProductToEdit(product);
        setIsProductModalOpen(true);
    };

    const handleDelete = async (id) => {
        const producto = productos.find(p => p.id === id);
        if (!producto) return;
        
        const nuevoEstado = producto.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
        const accionTerm = nuevoEstado === 'INACTIVO' ? 'inactivar' : 'reactivar';
        const tituloAction = nuevoEstado === 'INACTIVO' ? 'Inactivar' : 'Reactivar';
        
        const result = await alerts.confirm(`¿${tituloAction} producto?`, `¿Estás seguro de que deseas ${accionTerm} el producto "${producto.nombre}"?`);
        if (!result.isConfirmed) return;
        
        try {
            await ProductoService.update(id, {
                ...producto,
                estado: nuevoEstado
            });
            fetchData();
            alerts.toast('success', `Producto ${nuevoEstado === 'ACTIVO' ? 'reactivado' : 'inactivado'}`);
        } catch (error) {
            alerts.error('Error', `Error al ${accionTerm}: ` + error.message);
        }
    };

    const handleFormSuccess = () => {
        setIsProductModalOpen(false);
        setProductToEdit(null);
        fetchData();
    };

    const handleFormCancel = () => {
        setIsProductModalOpen(false);
        setProductToEdit(null);
    };

    // Filter Logic
    const filteredProductos = productos.filter(p => {
        const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategoria = filterCategoria ? p.categoria === filterCategoria : true;
        const matchesProveedor = filterProveedor ? p.proveedor_id == filterProveedor : true;
        const matchesEstado = filterEstado ? p.estado === filterEstado : true; 
        
        return matchesSearch && matchesCategoria && matchesProveedor && matchesEstado;
    });

    const categorias = [...new Set(productos.map(p => p.categoria))].filter(Boolean);

    return (
        <div className="space-y-6">
            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Inventario de Productos</h2>
                    <p className="text-gray-500 text-sm">Gestiona productos, stock y proveedores</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => { setProductToEdit(null); setIsProductModalOpen(true); }}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 shadow-sm transition-colors flex items-center gap-2"
                    >
                        <span>+</span> Nuevo Producto
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="col-span-1 md:col-span-1">
                    <input
                        type="text"
                        placeholder="🔍 Buscar producto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                <div>
                     <select 
                        value={filterCategoria} 
                        onChange={(e) => setFilterCategoria(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm cursor-pointer"
                    >
                        <option value="">Todas las Categorías</option>
                        {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <select 
                        value={filterProveedor} 
                        onChange={(e) => setFilterProveedor(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm cursor-pointer"
                    >
                        <option value="">Todos los Proveedores</option>
                        {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                </div>
                <div>
                    <select 
                        value={filterEstado} 
                        onChange={(e) => setFilterEstado(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm cursor-pointer"
                    >
                        <option value="">Todos los Estados</option>
                        <option value="ACTIVO">Activos</option>
                        <option value="INACTIVO">Inactivos</option>
                    </select>
                </div>
            </div>

            {/* Product List */}
            {loading ? (
                <div className="text-center py-10">Cargando inventario...</div>
            ) : (
                <ProductoList 
                    productos={filteredProductos} 
                    onEdit={handleEdit} 
                    onDelete={handleDelete}
                />
            )}

            {/* Product Modal */}
            {isProductModalOpen && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
                    <div className="relative mx-auto w-full max-w-4xl p-4">
                        <div className="bg-white rounded-xl shadow-xl overflow-hidden relative">
                             {/* Close Button X */}
                             <button 
                                onClick={handleFormCancel}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            
                            {/* We wrap the form in a padding div but the form itself has padding. 
                                We might strictly need to render ProductoForm directly or wrap it. 
                                ProductoForm has its own "Card" style with shadow. 
                                Let's wrap it in a clean div and pass props. */}
                            <div className="max-h-[90vh] overflow-y-auto">
                                <ProductoForm 
                                    productToEdit={productToEdit} 
                                    onSuccess={handleFormSuccess}
                                    onCancel={handleFormCancel}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductosPage;
