import React, { useState, useEffect } from 'react';
import { ProductoService, VentaService, JugadorService } from '../services/api';
import SearchableSelect from './SearchableSelect';
import { formatCurrency } from '../utils/formatters';
import { alerts } from '../utils/alerts';

const VentaForm = ({ onVentaCreated }) => {
    const [productos, setProductos] = useState([]);
    const [carrito, setCarrito] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [mensaje, setMensaje] = useState(null);
    const [pagos, setPagos] = useState([{ metodo: 'efectivo', monto: 0 }]);
    const [pagosValid, setPagosValid] = useState(true);

    const calcularTotal = () => {
        return carrito.reduce((total, item) => total + (item.precio_unitario * item.cantidad), 0);
    };

    const [jugadores, setJugadores] = useState([]);
    const [observaciones, setObservaciones] = useState('');

    useEffect(() => {
        cargarProductos();
        cargarJugadores();
    }, []);

    const cargarJugadores = async () => {
        try {
            const data = await JugadorService.getAll();
            setJugadores(data);
        } catch (error) {
            console.error('Error al cargar jugadores:', error);
        }
    };

    const cargarProductos = async () => {
        try {
            const data = await ProductoService.getAll({ estado: 'ACTIVO' });
            setProductos(data);
        } catch (error) {
            console.error('Error al cargar productos:', error);
        }
    };

    const agregarAlCarrito = (producto) => {
        if (producto.stock <= 0) return;

        const itemExistente = carrito.find(item => item.producto_id === producto.id);
        
        if (itemExistente) {
            if (producto.stock < itemExistente.cantidad + 1) {
                alerts.warning('Stock insuficiente', 'No hay suficiente stock de este producto.');
                return;
            }
            setCarrito(carrito.map(item => 
                item.producto_id === producto.id 
                    ? { ...item, cantidad: item.cantidad + 1 }
                    : item
            ));
        } else {
            setCarrito([...carrito, {
                producto_id: producto.id,
                nombre: producto.nombre,
                precio_unitario: parseFloat(producto.precio),
                cantidad: 1
            }]);
        }
    };

    const actualizarCantidad = (productoId, nuevaCantidad) => {
        if (nuevaCantidad < 1) return;
        
        const producto = productos.find(p => p.id === productoId);
        if (!producto) return;

        if (producto.stock < nuevaCantidad) {
            alerts.warning('Stock insuficiente', 'No hay suficiente stock de este producto.');
            return;
        }

        setCarrito(carrito.map(item => 
            item.producto_id === productoId 
                ? { ...item, cantidad: nuevaCantidad }
                : item
        ));
    };

    const eliminarDelCarrito = (productoId) => {
        setCarrito(carrito.filter(item => item.producto_id !== productoId));
    };





    // Update initial payment when cart changes if only one payment exists (and it's active)
    useEffect(() => {
        const total = calcularTotal();
        if (pagos.length === 1 && pagos[0].metodo && !pagos[0].manualUpdate) {
             setPagos([{ ...pagos[0], monto: total }]);
        }
    }, [carrito]);

    const handlePagoChange = (index, field, value) => {
        const newPagos = [...pagos];
        newPagos[index] = { ...newPagos[index], [field]: value, manualUpdate: true };
        
        // If changing method to something that requires helper data, reset it
        if (field === 'metodo') {
             if (value !== 'cuenta_corriente') {
                 delete newPagos[index].jugador;
             }
        }
        setPagos(newPagos);
    };
    
    const agregarPago = () => {
        const total = calcularTotal();
        const currentSum = pagos.reduce((sum, p) => sum + parseFloat(p.monto || 0), 0);
        const remaining = total - currentSum;
        if (remaining > 0) {
            setPagos([...pagos, { metodo: 'efectivo', monto: remaining }]);
        }
    };

    const eliminarPago = (index) => {
        if (pagos.length === 1) return;
        const newPagos = pagos.filter((_, i) => i !== index);
        setPagos(newPagos);
    };

    const finalizarVenta = async () => {
        if (carrito.length === 0) return;

        const total = calcularTotal();
        const sumaPagos = pagos.reduce((sum, p) => sum + parseFloat(p.monto || 0), 0);
        
        // Allow small floating point diffs
        if (Math.abs(sumaPagos - total) > 0.01) {
            alerts.warning('Error en montos', `El total de pagos ($${sumaPagos}) no coincide con el total de la venta ($${total})`);
            return;
        }

        // Validate account details
        for (const p of pagos) {
            if (p.metodo === 'cuenta_corriente' && !p.jugador) {
                 alerts.warning('Faltan datos', 'Debe seleccionar un jugador para los pagos con Cuenta Corriente');
                 return;
            }
        }

        setLoading(true);
        try {
            const ventaData = {
                items: carrito,
                total: total,
                observaciones: observaciones,
                pagos: pagos.map(p => ({
                    metodo: p.metodo,
                    monto: parseFloat(p.monto),
                    jugador_id: p.jugador ? p.jugador.id : null
                }))
            };
            
            await VentaService.create(ventaData);
            alerts.success('¡Éxito!', 'Venta realizada con éxito');
            setCarrito([]);
            setPagos([{ metodo: 'efectivo', monto: 0 }]); // Reset
            setObservaciones('');
            cargarProductos(); // Recargar para actualizar stock
            if (onVentaCreated) onVentaCreated();
        } catch (error) {
            console.error('Error al realizar venta:', error);
            alerts.error('Error', 'No se pudo realizar la venta: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    const currentTotal = calcularTotal();
    const pagosTotal = pagos.reduce((sum, p) => sum + parseFloat(p.monto || 0), 0);
    const restante = currentTotal - pagosTotal;

    const filteredProductos = productos.filter(p => 
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) && p.stock > 0
    );

    return (
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6 h-auto lg:h-[calc(100vh-100px)]">
            {/* Left Column: Product Catalog */}
            <div className="w-full lg:w-2/3 flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-[400px] md:h-[500px] lg:h-auto">
                <div className="p-3 md:p-4 border-b border-gray-100 bg-gray-50">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Buscar productos..."
                            className="w-full pl-10 pr-4 py-2 text-sm md:text-base rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-3 md:p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
                        {filteredProductos.map(producto => (
                            <button
                                key={producto.id}
                                onClick={() => agregarAlCarrito(producto)}
                                disabled={producto.stock <= 0}
                                className={`flex flex-col items-start p-2 md:p-4 rounded-lg border transition-all duration-200 text-left ${
                                    producto.stock > 0 
                                        ? 'border-gray-200 hover:border-indigo-500 hover:shadow-md bg-white' 
                                        : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                                }`}
                            >
                                <div className="w-full flex justify-between items-start mb-1 md:mb-2">
                                    <span className="font-semibold text-gray-800 line-clamp-2 text-xs md:text-sm">{producto.nombre}</span>
                                    <span className={`text-xs font-medium px-1.5 md:px-2 py-0.5 rounded-full flex-shrink-0 ml-1 ${
                                        producto.stock > 10 ? 'bg-green-100 text-green-800' : 
                                        producto.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {producto.stock}
                                    </span>
                                </div>
                                <div className="text-indigo-600 font-bold text-base md:text-lg">${formatCurrency(producto.precio)}</div>
                                <div className="text-xs text-gray-500 mt-0.5 md:mt-1 capitalize truncate w-full">{producto.categoria}</div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Column: Cart/Ticket */}
            <div className="w-full lg:w-1/3 flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-3 md:p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h2 className="text-base md:text-lg font-semibold text-gray-800">Ticket de Venta</h2>
                    <span className="text-xs md:text-sm text-gray-500">{carrito.length} items</span>
                </div>

                <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 md:space-y-3">
                    {carrito.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <span className="text-4xl mb-2">🛒</span>
                            <p>El carrito está vacío</p>
                        </div>
                    ) : (
                        carrito.map(item => (
                            <div key={item.producto_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group">
                                <div className="flex-1">
                                    <h4 className="font-medium text-gray-900">{item.nombre}</h4>
                                    <div className="text-sm text-gray-500">${formatCurrency(item.precio_unitario)} x {item.cantidad}</div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <div className="flex items-center bg-white rounded-md border border-gray-200">
                                        <button 
                                            onClick={() => actualizarCantidad(item.producto_id, item.cantidad - 1)}
                                            className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded-l-md"
                                        >
                                            -
                                        </button>
                                        <span className="px-2 text-sm font-medium">{item.cantidad}</span>
                                        <button 
                                            onClick={() => actualizarCantidad(item.producto_id, item.cantidad + 1)}
                                            className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded-r-md"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <div className="text-right min-w-[60px]">
                                        <div className="font-semibold text-gray-900">${formatCurrency(item.precio_unitario * item.cantidad)}</div>
                                        <button 
                                            onClick={() => eliminarDelCarrito(item.producto_id)}
                                            className="text-xs text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100">
                    {mensaje && (
                        <div className={`mb-3 p-2 text-sm rounded-md text-center ${mensaje.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {mensaje.text}
                        </div>
                    )}
                    
                    <div className="mb-4 space-y-3">
                        <label className="block text-sm font-medium text-gray-700">Pagos</label>
                        {pagos.map((pago, index) => (
                            <div key={index} className="p-3 bg-white rounded border border-gray-200 space-y-2">
                                <div className="flex gap-2">
                                     <select
                                        value={pago.metodo}
                                        onChange={(e) => handlePagoChange(index, 'metodo', e.target.value)}
                                        className="w-1/2 border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-indigo-500"
                                    >
                                        <option value="efectivo">Efectivo</option>
                                        <option value="transferencia">Transferencia</option>
                                        <option value="qr">QR</option>
                                        <option value="cuenta_corriente">Cuenta Corriente</option>
                                        <option value="gastos_generales">Gastos / Cortesía</option>
                                    </select>
                                    <input 
                                        type="number" 
                                        value={pago.monto} 
                                        onChange={(e) => handlePagoChange(index, 'monto', e.target.value)}
                                        className="w-1/2 border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-indigo-500"
                                    />
                                    {pagos.length > 1 && (
                                        <button onClick={() => eliminarPago(index)} className="text-red-500 hover:text-red-700">✕</button>
                                    )}
                                </div>
                                {pago.metodo === 'cuenta_corriente' && (
                                    <div className="text-sm">
                                         <SearchableSelect
                                            options={jugadores}
                                            value={pago.jugador ? pago.jugador.id : ''}
                                            onChange={(option) => handlePagoChange(index, 'jugador', option)}
                                            labelKey="nombre"
                                            valueKey="id"
                                            placeholder="Seleccionar Jugador..."
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                        
                        <div className="flex justify-between items-center text-sm pt-1">
                            {restante > 0.01 ? (
                                <button onClick={agregarPago} className="text-indigo-600 font-medium hover:text-indigo-800">
                                    + Agregar otro método (${formatCurrency(restante)})
                                </button>
                            ) : (
                                <span className="text-green-600 font-medium flex items-center">
                                    ✓ Pago cubierto
                                </span>
                            )}
                            {restante < -0.01 && (
                                <span className="text-red-500 font-medium">Exceso: ${formatCurrency(Math.abs(restante))}</span>
                            )}
                        </div>
                    </div>

                    <div className="mb-4">
                         <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                            <textarea
                                value={observaciones}
                                onChange={(e) => setObservaciones(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                rows="2"
                                placeholder="..."
                            />
                    </div>

                    <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-600">Total a Pagar</span>
                        <span className="text-2xl font-bold text-gray-900">${formatCurrency(currentTotal)}</span>
                    </div>
                    <button 
                        onClick={finalizarVenta}
                        disabled={carrito.length === 0 || loading || Math.abs(restante) > 0.01}
                        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? 'Procesando...' : 'Cobrar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VentaForm;
