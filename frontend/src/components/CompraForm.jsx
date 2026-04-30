import React, { useState, useEffect } from 'react';
import { CompraService, ProductoService } from '../services/api';
import SearchableSelect from './SearchableSelect';
import { formatCurrency } from '../utils/formatters';
import { alerts } from '../utils/alerts';

const CompraForm = ({ onCompraSaved, onCancel, proveedores, initialData = null }) => {
    const [proveedorId, setProveedorId] = useState(initialData?.proveedor_id || '');
    const [observaciones, setObservaciones] = useState(initialData?.observaciones || '');
    const [items, setItems] = useState(initialData?.items?.map(i => ({
        producto_id: i.producto_id,
        nombre: i.producto_nombre,
        cantidad: i.cantidad,
        costo_unitario: i.costo_unitario
    })) || []);
    const [productos, setProductos] = useState([]);

    useEffect(() => {
        fetchProductos();
    }, []);

    const fetchProductos = async () => {
        try {
            const data = await ProductoService.getAll();
            setProductos(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddItem = () => {
        setItems([...items, { producto_id: '', cantidad: 1, costo_unitario: 0 }]);
    };

    const handleRemoveItem = (index) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index] }; // Shallow copy of the item
        newItems[index][field] = value;
        
        // Auto-fill cost if product selected
        if (field === 'producto_id') {
            // Use loose equality or String conversion for safety
            const prod = productos.find(p => String(p.id) === String(value));
            if (prod) {
                // If costo is 0/null, we leave it as 0. 
                // Note: Ensure backend sends 'costo' as a number or numeric string.
                newItems[index].costo_unitario = prod.costo || 0;
                newItems[index].nombre = prod.nombre;
                console.log(`Producto seleccionado: ${prod.nombre}, Costo: ${prod.costo}`);
            }
        }
        setItems(newItems);
    };

    const calculateTotal = () => {
        return items.reduce((acc, item) => acc + (item.cantidad * item.costo_unitario), 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!proveedorId) return alerts.warning('Datos faltantes', 'Seleccione un proveedor');
        if (items.length === 0) return alerts.warning('Datos faltantes', 'Agregue al menos un producto');

        const compraData = {
            proveedor_id: proveedorId,
            observaciones,
            items: items.map(i => ({
                producto_id: i.producto_id,
                cantidad: parseFloat(i.cantidad),
                costo_unitario: parseFloat(i.costo_unitario)
            }))
        };

        try {
            if (initialData) {
                await CompraService.update(initialData.id, compraData);
            } else {
                await CompraService.create(compraData);
            }
            alerts.toast('success', 'Compra guardada exitosamente');
            onCompraSaved();
        } catch (err) {
            alerts.error('Error', 'No se pudo guardar la compra');
            console.error(err);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-4">{initialData ? 'Editar Compra' : 'Nueva Compra'}</h3>
            
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-gray-700 font-bold mb-2">Proveedor</label>
                    <select 
                        value={proveedorId}
                        onChange={(e) => setProveedorId(e.target.value)}
                        className="shadow border rounded w-full py-2 px-3 text-gray-700"
                        disabled={!!initialData}
                    >
                        <option value="">Seleccione...</option>
                        {proveedores.map(p => (
                            <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                    </select>
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 font-bold mb-2">Observaciones</label>
                    <textarea 
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                        className="shadow border rounded w-full py-2 px-3 text-gray-700"
                    />
                </div>

                <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-gray-700 font-bold">Items del Pedido</label>
                        <button type="button" onClick={handleAddItem} className="bg-blue-500 text-white px-2 py-1 rounded text-sm">
                            + Agregar Producto
                        </button>
                    </div>
                    
                    <div className="space-y-2">
                        {items.map((item, index) => (
                            <div key={index} className="flex gap-2 items-center bg-gray-50 p-2 rounded">
                                <div className="flex-1 min-w-[200px]">
                                    <SearchableSelect 
                                        options={productos}
                                        value={item.producto_id}
                                        onChange={(option) => handleItemChange(index, 'producto_id', option.id)}
                                        placeholder="Buscar producto..."
                                        labelKey="nombre"
                                        valueKey="id"
                                    />
                                </div>
                                <input 
                                    type="number" 
                                    placeholder="Cant."
                                    value={item.cantidad}
                                    onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)}
                                    className="w-20 border rounded px-2 py-1 text-sm"
                                    min="1"
                                    required
                                />
                                <input 
                                    type="number" 
                                    placeholder="Costo"
                                    value={item.costo_unitario}
                                    onChange={(e) => handleItemChange(index, 'costo_unitario', e.target.value)}
                                    className="w-24 border rounded px-2 py-1 text-sm"
                                    min="0"
                                    step="0.01"
                                    required
                                />
                                <div className="w-24 text-right text-sm font-semibold">
                                    ${formatCurrency(item.cantidad * item.costo_unitario)}
                                </div>
                                <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-500 font-bold">
                                    &times;
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-between items-center text-xl font-bold border-t pt-4 mt-4">
                    <span>Total Compra:</span>
                    <span>${formatCurrency(calculateTotal())}</span>
                </div>

                <div className="flex justify-between gap-2 mt-6">
                    <div>
                        {initialData && initialData.estado === 'PENDIENTE' && (
                             <button 
                                type="button" 
                                onClick={async () => {
                                    const result = await alerts.confirm('¿Confirmar recepción?', '¿Está seguro de que recibió la mercadería? Esto actualizará el stock y los costos de los productos de forma permanente.');
                                    if(!result.isConfirmed) return;
                                    try {
                                        await CompraService.confirmar(initialData.id);
                                        alerts.toast('success', 'Stock y costos actualizados');
                                        onCompraSaved();
                                    } catch(e) {
                                        alerts.error('Error', 'No se pudo confirmar la mercadería: ' + (e.response?.data?.error || e.message));
                                    }
                                }} 
                                className="bg-green-600 hover:bg-green-800 text-white font-bold py-2 px-4 rounded"
                            >
                                Recibir Mercadería (Cargar Stock)
                            </button>
                        )}
                         {initialData && initialData.estado === 'RECIBIDO' && (
                            <span className="text-green-600 font-bold border border-green-600 rounded px-4 py-2 bg-green-50">
                                ✓ Mercadería Recibida
                            </span>
                        )}
                    </div>

                    <div className="flex gap-2">
                         <button type="button" onClick={onCancel} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded">
                            Cancelar
                        </button>
                        {(!initialData || initialData.estado === 'PENDIENTE') && (
                            <button type="submit" className="bg-indigo-600 hover:bg-indigo-800 text-white font-bold py-2 px-4 rounded">
                                {initialData ? 'Actualizar Compra' : 'Guardar Compra (Generar Deuda)'}
                            </button>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CompraForm;
