import React, { useState, useEffect } from 'react';
import { CuentaService, VentaService } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import { alerts } from '../utils/alerts';

const CuentaCorrienteModal = ({ jugador, onClose }) => {
    const [movimientos, setMovimientos] = useState([]);
    const [saldo, setSaldo] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [tipoMovimiento, setTipoMovimiento] = useState('DEBE'); // DEBE (Deuda), HABER (Pago)
    const [monto, setMonto] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [metodoPago, setMetodoPago] = useState('efectivo');
    
    // Details viewing state
    const [expandedMovimientoId, setExpandedMovimientoId] = useState(null);
    const [detailsCache, setDetailsCache] = useState({});
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        if (jugador) {
            fetchCuenta();
        }
    }, [jugador]);

    const fetchCuenta = async () => {
        setLoading(true);
        try {
            const data = await CuentaService.getMovimientos(jugador.id);
            setMovimientos(data.movimientos);
            setSaldo(data.saldo);
        } catch (error) {
            console.error('Error fetching cuenta:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTransaction = async (e) => {
        e.preventDefault();
        try {
            let descFinal = descripcion;
            if (tipoMovimiento === 'HABER') {
                descFinal = `Pago de Cuenta Corriente` + (descripcion ? ` - ${descripcion}` : '');
            } else if (!descFinal) {
                descFinal = 'Deuda manual';
            }

            await CuentaService.addMovimiento({
                jugador_id: jugador.id,
                tipo: tipoMovimiento,
                monto: parseFloat(monto),
                descripcion: descFinal,
                metodo_pago: tipoMovimiento === 'HABER' ? metodoPago : null
            });
            setShowForm(false);
            setMonto('');
            setDescripcion('');
            alerts.toast('success', 'Movimiento registrado');
            fetchCuenta(); 
        } catch (error) {
            alerts.error('Error', 'No se pudo registrar el movimiento');
        }
    };

    const toggleDetails = async (movimiento) => {
        if (expandedMovimientoId === movimiento.id) {
            setExpandedMovimientoId(null);
            return;
        }

        // Only expand if it's a Venta (check referencing_id or description)
        if (!movimiento.referencia_id || !movimiento.descripcion.includes('Venta')) {
             return; // Or show alert that no details available?
        }

        setExpandedMovimientoId(movimiento.id);

        if (!detailsCache[movimiento.referencia_id]) {
            setLoadingDetails(true);
            try {
                const details = await VentaService.getDetalles(movimiento.referencia_id);
                setDetailsCache(prev => ({ ...prev, [movimiento.referencia_id]: details }));
            } catch (error) {
                console.error("Error fetching venta details", error);
            } finally {
                setLoadingDetails(false);
            }
        }
    };

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Calculate pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentMovimientos = movimientos.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(movimientos.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="relative mx-auto w-full max-w-4xl shadow-2xl rounded-xl bg-white max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-4 sm:p-6 border-b bg-white flex-shrink-0">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate pr-4">
                        Cuenta Corriente: <span className="text-indigo-600">{jugador.nombre}</span>
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="overflow-y-auto flex-grow p-4 sm:p-6 bg-gray-50">
                    {/* Saldo y Acciones */}
                    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Saldo Actual</p>
                                <p className={`text-3xl sm:text-4xl font-black ${saldo > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    ${formatCurrency(saldo)}
                                </p>
                                <p className="text-xs font-medium text-gray-500 mt-1">
                                    {saldo > 0 ? '🔴 Tenés una deuda pendiente' : '🟢 Saldo a favor / Al día'}
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                <button 
                                    onClick={() => { setTipoMovimiento('DEBE'); setShowForm(true); }}
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-red-50 text-red-700 px-4 py-2.5 rounded-lg hover:bg-red-100 font-bold transition-all border border-red-100"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                    </svg>
                                    Deuda
                                </button>
                                <button 
                                    onClick={() => { setTipoMovimiento('HABER'); setShowForm(true); }}
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-green-50 text-green-700 px-4 py-2.5 rounded-lg hover:bg-green-100 font-bold transition-all border border-green-100"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                    </svg>
                                    Pago
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Formulario de Transacción */}
                    {showForm && (
                         <div className="bg-white border-2 border-indigo-100 rounded-xl p-4 sm:p-6 mb-6 shadow-md animate-in slide-in-from-top duration-200">
                            <h4 className="text-sm font-bold uppercase tracking-wide text-indigo-600 mb-4 flex items-center gap-2">
                                {tipoMovimiento === 'DEBE' ? (
                                    <>
                                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                        Registrar Nueva Deuda
                                    </>
                                ) : (
                                    <>
                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                        Registrar Nuevo Pago
                                    </>
                                )}
                            </h4>
                            <form onSubmit={handleTransaction} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Monto</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2 text-gray-400">$</span>
                                            <input 
                                                type="number" step="0.01" min="0" required 
                                                value={monto} 
                                                onChange={(e) => setMonto(e.target.value)}
                                                className="block w-full border border-gray-300 rounded-lg py-2 pl-7 pr-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" 
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                    
                                    {tipoMovimiento === 'HABER' && (
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Método</label>
                                            <select
                                                value={metodoPago}
                                                onChange={(e) => setMetodoPago(e.target.value)}
                                                className="block w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                            >
                                                <option value="efectivo">Efectivo 💵</option>
                                                <option value="transferencia">Transferencia 📱</option>
                                                <option value="qr">QR 📲</option>
                                            </select>
                                        </div>
                                    )}

                                    <div className={`${tipoMovimiento === 'HABER' ? 'sm:col-span-2 md:col-span-1' : 'sm:col-span-1 md:col-span-2'}`}>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción</label>
                                        <input 
                                            type="text" 
                                            value={descripcion} 
                                            onChange={(e) => setDescripcion(e.target.value)}
                                            className="block w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" 
                                            placeholder={tipoMovimiento === 'DEBE' ? 'Ej: Compra de gaseosa' : 'Opcional...'}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3 justify-end pt-2">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowForm(false)}
                                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit" 
                                        className={`px-6 py-2 rounded-lg text-white font-bold shadow-sm transition-all ${
                                            tipoMovimiento === 'DEBE' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                                        }`}
                                    >
                                        Guardar Movimiento
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Lista de Movimientos */}
                    <div className="space-y-4 mb-6">
                        <div className="flex justify-between items-center mb-2 px-1">
                            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Movimientos Recientes</h4>
                        </div>
                        
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
                                <p className="text-gray-500 font-medium">Cargando movimientos...</p>
                            </div>
                        ) : currentMovimientos.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                                <p className="text-gray-400">No se encontraron movimientos registrados.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {currentMovimientos.map((mov) => (
                                    <div key={mov.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
                                        <div className="p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">
                                                        {new Date(mov.fecha).toLocaleDateString()} - {new Date(mov.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </span>
                                                    <span className="text-sm font-bold text-gray-800">
                                                        {mov.descripcion || 'Sin descripción'}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-lg font-black leading-none ${
                                                        mov.tipo === 'DEBE' ? 'text-red-600' : 'text-green-600'
                                                    }`}>
                                                        {mov.tipo === 'DEBE' ? '-' : '+'}${formatCurrency(mov.monto)}
                                                    </p>
                                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase mt-1 ${
                                                        mov.tipo === 'DEBE' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                                                    }`}>
                                                        {mov.tipo === 'DEBE' ? 'Deuda' : 'Pago'}
                                                    </span>
                                                </div>
                                            </div>

                                            {mov.referencia_id && (
                                                <button 
                                                    onClick={() => toggleDetails(mov)}
                                                    className="w-full mt-2 flex items-center justify-center gap-1 py-1.5 px-3 bg-gray-50 rounded-lg text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-colors border border-transparent hover:border-indigo-100"
                                                >
                                                    {expandedMovimientoId === mov.id ? (
                                                        <>Ocultar detalles <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg></>
                                                    ) : (
                                                        <>Ver detalles de la venta <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></>
                                                    )}
                                                </button>
                                            )}

                                            {expandedMovimientoId === mov.id && (
                                                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100 animate-in fade-in duration-200">
                                                    {loadingDetails && !detailsCache[mov.referencia_id] ? (
                                                        <div className="flex items-center gap-2 text-xs text-gray-500 italic">
                                                            <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                                            Cargando items...
                                                        </div>
                                                    ) : detailsCache[mov.referencia_id] ? (
                                                        <div className="space-y-2">
                                                            <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Items de la Venta</p>
                                                            <ul className="divide-y divide-gray-200">
                                                                {detailsCache[mov.referencia_id].map((detalle, idx) => (
                                                                    <li key={idx} className="py-2 flex justify-between items-center text-sm">
                                                                        <div className="flex flex-col">
                                                                            <span className="font-semibold text-gray-700">{detalle.producto_nombre}</span>
                                                                            <span className="text-xs text-gray-400">Cantidad: {detalle.cantidad}</span>
                                                                        </div>
                                                                        <span className="font-bold text-gray-800">
                                                                            ${formatCurrency(detalle.subtotal || (detalle.cantidad * detalle.precio_unitario))}
                                                                        </span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                            <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                                                                <span className="text-xs font-bold text-gray-500">TOTAL</span>
                                                                <span className="text-sm font-black text-indigo-600">
                                                                    ${formatCurrency(mov.monto)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-gray-500 italic">No hay detalles disponibles.</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-1 pb-4">
                            <button
                                onClick={() => {
                                    paginate(currentPage - 1);
                                    document.querySelector('.overflow-y-auto').scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700">
                                {currentPage} <span className="text-gray-400 font-normal mx-1">/</span> {totalPages}
                            </div>
                            <button
                                onClick={() => {
                                    paginate(currentPage + 1);
                                    document.querySelector('.overflow-y-auto').scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-gray-50 border-t flex-shrink-0 flex justify-end">
                    <button 
                        onClick={onClose}
                        className="w-full sm:w-auto bg-gray-800 text-white px-8 py-2.5 rounded-lg font-bold hover:bg-gray-900 transition-all shadow-md active:scale-95"
                    >
                        Cerrar Cuenta
                    </button>
                </div>
            </div>
        </div>

    );
};

export default CuentaCorrienteModal;
