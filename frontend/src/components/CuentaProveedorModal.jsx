import React, { useState, useEffect } from 'react';
import { ProveedorService } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import { alerts } from '../utils/alerts';

const CuentaProveedorModal = ({ proveedor, onClose }) => {
    const [movimientos, setMovimientos] = useState([]);
    const [saldo, setSaldo] = useState(0); // Positive = We Owe (Deuda)
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [tipoMovimiento, setTipoMovimiento] = useState('DEBE'); // DEBE (Compra/Deuda), HABER (Pago realizado)
    const [monto, setMonto] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [metodoPago, setMetodoPago] = useState('efectivo');

    useEffect(() => {
        if (proveedor) {
            fetchCuenta();
        }
    }, [proveedor]);

    const fetchCuenta = async () => {
        setLoading(true);
        try {
            // Similar to Player account but using ProveedorService
            // Ensure endpoint returns { saldo: number, movimientos: [] } or just [] and we calc saldo?
            // ProveedorModel.getAll returns saldo. getMovimientos returns list.
            // Let's refactor backend controller slightly if we want unified response, 
            // OR just fetch movements and rely on the saldo passed in 'proveedor' prop (but that might be stale).
            // Actually, for players we returned { movimientos, saldo } in one call.
            // For Suppliers, I implemented `getCuenta` returning just movements in Controller.
            // I should verify if I need to calc saldo here or fetch it.
            // Let's calc saldo from movements for consistency or update backend to return both.
            // For now, I'll calculate it client-side from movements to be safe, 
            // OR better: Update controller to return balance.
            
            // Client side calc:
            const movs = await ProveedorService.getMovimientos(proveedor.id);
            setMovimientos(movs);
            
            // Calc saldo: DEBE - HABER
            const calcSaldo = movs.reduce((acc, curr) => {
                const m = parseFloat(curr.monto);
                return curr.tipo === 'DEBE' ? acc + m : acc - m;
            }, 0);
            setSaldo(calcSaldo);

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
                descFinal = descripcion 
                    ? `${descripcion} - ${metodoPago}`
                    : `Pago realizado (${metodoPago})`;
            } else if (!descFinal) {
                descFinal = 'Compra / Gasto';
            }

            await ProveedorService.addMovimiento({
                proveedor_id: proveedor.id,
                tipo: tipoMovimiento,
                monto: parseFloat(monto),
                descripcion: descFinal
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

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="relative mx-auto w-full max-w-4xl shadow-2xl rounded-xl bg-white max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-4 sm:p-6 border-b bg-white flex-shrink-0">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate pr-4">
                        Cuenta Corriente: <span className="text-indigo-600">{proveedor.nombre}</span>
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
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Monto Pendiente de Pago</p>
                                <p className={`text-3xl sm:text-4xl font-black ${saldo > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    ${formatCurrency(saldo)}
                                </p>
                                <p className="text-xs font-medium text-gray-500 mt-1">
                                    {saldo > 0 ? '🔴 Debemos al proveedor' : '🟢 Saldo a favor / Saldado'}
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
                                    Compra
                                </button>
                                <button 
                                    onClick={() => { setTipoMovimiento('HABER'); setShowForm(true); }}
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-green-50 text-green-700 px-4 py-2.5 rounded-lg hover:bg-green-100 font-bold transition-all border border-green-100"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                    </svg>
                                    Pago Realizado
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
                                        Registrar Nueva Compra / Deuda
                                    </>
                                ) : (
                                    <>
                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                        Registrar Nuevo Pago al Proveedor
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
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Método de Pago</label>
                                            <select
                                                value={metodoPago}
                                                onChange={(e) => setMetodoPago(e.target.value)}
                                                className="block w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                            >
                                                <option value="efectivo">Efectivo 💵</option>
                                                <option value="transferencia">Transferencia 📱</option>
                                                <option value="cheque">Cheque 🎫</option>
                                                <option value="otro">Otro</option>
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
                                            placeholder={tipoMovimiento === 'DEBE' ? 'Ej: Factura Nº 1234' : 'Opcional...'}
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
                        ) : movimientos.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                                <p className="text-gray-400">No se encontraron movimientos registrados.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {movimientos.map((mov) => (
                                    <div key={mov.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
                                        <div className="p-4">
                                            <div className="flex justify-between items-start">
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
                                                        ${formatCurrency(mov.monto)}
                                                    </p>
                                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase mt-1 ${
                                                        mov.tipo === 'DEBE' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                                                    }`}>
                                                        {mov.tipo === 'DEBE' ? 'Compra' : 'Pago'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
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

export default CuentaProveedorModal;
