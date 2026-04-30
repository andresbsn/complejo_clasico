import React from 'react';
import { formatCurrency } from '../utils/formatters';

const ProductoList = ({ productos, onEdit, onDelete }) => {
    if (!productos || productos.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 bg-white rounded-lg shadow-sm border border-gray-100">
                <p className="text-lg">No se encontraron productos.</p>
                <p className="text-sm">Prueba ajustando los filtros o la búsqueda.</p>
            </div>
        );
    }

    return (
        <>
            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {productos.map((producto) => (
                    <div key={producto.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                                <h3 className="text-base font-semibold text-gray-900">{producto.nombre}</h3>
                                <p className="text-xs text-gray-500 mt-1">{producto.categoria}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                producto.estado === 'ACTIVO' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                                {producto.estado}
                            </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                            <div>
                                <span className="text-gray-500 text-xs">Proveedor:</span>
                                <p className="font-medium text-gray-900">{producto.proveedor_nombre || '-'}</p>
                            </div>
                            <div>
                                <span className="text-gray-500 text-xs">Stock:</span>
                                <div className="flex items-center gap-1">
                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                                        producto.stock > producto.stock_minimo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {producto.stock}
                                    </span>
                                    {producto.stock <= producto.stock_minimo && (
                                        <span className="text-xs text-red-500 font-bold">⚠</span>
                                    )}
                                </div>
                            </div>
                            <div>
                                <span className="text-gray-500 text-xs">Costo:</span>
                                <p className="font-medium text-gray-900">${formatCurrency(producto.costo)}</p>
                            </div>
                            <div>
                                <span className="text-gray-500 text-xs">Precio:</span>
                                <p className="font-semibold text-gray-900">${formatCurrency(producto.precio)}</p>
                            </div>
                        </div>
                        
                        <div className="flex gap-2 pt-3 border-t border-gray-100">
                            <button 
                                onClick={() => onEdit(producto)}
                                className="flex-1 text-indigo-600 hover:text-indigo-900 font-medium text-sm py-2 px-3 border border-indigo-200 rounded-md hover:bg-indigo-50 transition-colors"
                            >
                                Editar
                            </button>
                            <button 
                                onClick={() => onDelete(producto.id)}
                                className="flex-1 text-orange-600 hover:text-orange-900 font-medium text-sm py-2 px-3 border border-orange-200 rounded-md hover:bg-orange-50 transition-colors"
                            >
                                {producto.estado === 'ACTIVO' ? 'Inactivar' : 'Activar'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-hidden bg-white shadow-sm rounded-lg border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Costo</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {productos.map((producto) => (
                                <tr key={producto.id} className="hover:bg-gray-50 transition-colors duration-150">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{producto.nombre}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{producto.categoria}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{producto.proveedor_nombre || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatCurrency(producto.costo)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">${formatCurrency(producto.precio)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                producto.stock > producto.stock_minimo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                {producto.stock}
                                            </span>
                                            {producto.stock <= producto.stock_minimo && (
                                                <span className="text-xs text-red-500 font-bold" title={`Stock mínimo: ${producto.stock_minimo}`}>⚠</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            producto.estado === 'ACTIVO' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {producto.estado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                        <button 
                                            onClick={() => onEdit(producto)}
                                            className="text-indigo-600 hover:text-indigo-900 transition-colors duration-150"
                                        >
                                            Editar
                                        </button>
                                        <button 
                                            onClick={() => onDelete(producto.id)}
                                            className="text-orange-600 hover:text-orange-900 transition-colors duration-150"
                                        >
                                            {producto.estado === 'ACTIVO' ? 'Inactivar' : 'Activar'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

export default ProductoList;
