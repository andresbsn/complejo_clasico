import React, { useState, useEffect } from 'react';
import { CajaService } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { alerts } from '../utils/alerts';

const CajaPage = () => {
    const { user } = useAuth();
    const isAdmin = user?.rol === 'admin';
    const [caja, setCaja] = useState(null);
    const [movimientos, setMovimientos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saldoInicial, setSaldoInicial] = useState('');
    const [saldoFinalReal, setSaldoFinalReal] = useState('');
    const [tab, setTab] = useState('actual'); // 'actual', 'historial'
    const [historial, setHistorial] = useState([]);
    
    // Paginación y Detalles
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;
    const [selectedMov, setSelectedMov] = useState(null);
    const [movDetail, setMovDetail] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchEstado();
    }, []);

    useEffect(() => {
        if (tab === 'historial') {
            fetchHistorial();
        }
    }, [tab]);

    const fetchEstado = async () => {
        setLoading(true);
        try {
            const data = await CajaService.getEstado();
            setCaja(data);
            if (data) {
                const movs = await CajaService.getMovimientos(data.id);
                setMovimientos(movs);
            }
        } catch (err) {
            console.error(err);
            setError('Error al cargar estado de la caja');
        } finally {
            setLoading(false);
        }
    };

    const fetchHistorial = async () => {
        try {
            const data = await CajaService.getHistorial();
            setHistorial(data);
        } catch (err) {
            console.error(err);
            alerts.error('Error', 'Error al cargar historial');
        }
    };

    const handleAbrir = async (e) => {
        e.preventDefault();
        try {
            await CajaService.abrir(parseFloat(saldoInicial));
            alerts.success('¡Éxito!', 'Caja abierta correctamente');
            setSaldoInicial('');
            fetchEstado();
        } catch (err) {
            alerts.error('Error', err.response?.data?.error || 'Error al abrir caja');
        }
    };

    const handleCerrar = async (e) => {
        e.preventDefault();
        if (!caja) return;
        
        const saldoCalculado = calcularSaldoActual();
        const final = saldoFinalReal ? parseFloat(saldoFinalReal) : saldoCalculado;
        
        const result = await alerts.confirm('¿Cerrar caja?', '¿Estás seguro de que deseas cerrar la caja ahora?');
        if (!result.isConfirmed) return;

        try {
            await CajaService.cerrar(caja.id, final);
            alerts.success('¡Éxito!', 'Caja cerrada correctamente');
            setCaja(null);
            setMovimientos([]);
            setSaldoFinalReal('');
            fetchEstado(); // Will return null
        } catch (err) {
             alerts.error('Error', err.response?.data?.error || 'Error al cerrar caja');
        }
    };

    const calcularSaldoActual = () => {
        if (!caja) return 0;
        let total = parseFloat(caja.saldo_inicial);
        movimientos.forEach(m => {
            // Logic depends on type.
            // Venta: Add
            // Pago Turno: Add
            // Inscripcion: Add
            // Pago Deuda (Haber): Add
            // If we implement Expenses/Retiros later, subtract.
            // For now everything is income except maybe cancelled? 
            // Query returns positive amounts usually.
            // Assuming all movements returned are INCOME for now.
            // Wait, movements don't specify sign in my query?
            // Venta, Pago, Inscripcion are income.
            // Movimiento Cuenta: 'HABER' is income.
            
            // Exclude non-cash movements from physical balance
            const metodo = (m.metodo_pago || '').toLowerCase();
            const esEfectivo = metodo.includes('efectivo');
            const esDigital = metodo.includes('qr') || metodo.includes('debito') || metodo.includes('credito') || metodo.includes('transferencia');
            
            // Only 'efectivo' affects the physical cash balance used for closing
            if (esEfectivo) {
                total += parseFloat(m.monto);
            }
        });
        return total;
    };

    const calcularIngresosTotales = () => {
        let total = 0;
        movimientos.forEach(m => {
            const monto = parseFloat(m.monto);
            if (monto > 0) {
                const metodo = (m.metodo_pago || '').toLowerCase();
                const esEfectivo = metodo.includes('efectivo');
                const esDigital = metodo.includes('qr') || metodo.includes('debito') || metodo.includes('credito') || metodo.includes('transferencia');
                
                if (esEfectivo || esDigital) {
                    total += monto;
                }
            }
        });
        return total;
    };

    const handleVerDetalle = async (mov) => {
        setSelectedMov(mov);
        setShowModal(true);
        setMovDetail(null);
        
        const isVenta = mov.tipo_movimiento === 'VENTA';
        const isVentaGasto = mov.tipo_movimiento === 'GASTO' && mov.descripcion?.includes('Venta #');

        if ((isVenta || isVentaGasto) && mov.referencia_id) {
            setLoadingDetail(true);
            try {
                const data = await CajaService.getVentaDetalles(mov.referencia_id);
                setMovDetail(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingDetail(false);
            }
        }
    };

    // Paginación
    const totalPages = Math.ceil(movimientos.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentMovimientos = movimientos.slice(startIndex, startIndex + itemsPerPage);

    if (loading && !caja) return <div className="p-4">Cargando...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Control de Caja</h2>
                <div className="space-x-2">
                    <button 
                        className={`px-4 py-2 rounded ${tab === 'actual' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600'}`}
                        onClick={() => setTab('actual')}
                    >
                        Caja Actual
                    </button>
                    <button 
                        className={`px-4 py-2 rounded ${tab === 'historial' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600'}`}
                        onClick={() => setTab('historial')}
                    >
                        Historial
                    </button>
                </div>
            </div>

            {/* Legacy alert blocks removed - now using SweetAlert2 */}

            {tab === 'actual' && (
                <>
                    {!caja ? (
                        <div className="bg-white rounded-lg shadow p-6 max-w-md mx-auto mt-10">
                            <h3 className="text-lg font-semibold mb-4">Apertura de Caja</h3>
                            <form onSubmit={handleAbrir}>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Saldo Inicial</label>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        value={saldoInicial} 
                                        onChange={(e) => setSaldoInicial(e.target.value)}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        required
                                    />
                                </div>
                                <button type="submit" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full">
                                    Abrir Caja
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Resumen Totales por Método */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {(() => {
                                    // Calcular totales
                                    const totales = {
                                        efectivo: { nombre: 'EFECTIVO', icon: '💰', ingresos: 0, egresos: 0, count: 0, inicial: parseFloat(caja.saldo_inicial) || 0 },
                                        qr: { nombre: 'QR/DIGITAL', icon: '💳', ingresos: 0, egresos: 0, count: 0, inicial: 0 },
                                        transferencia: { nombre: 'TRANSFERENCIA', icon: '🔄', ingresos: 0, egresos: 0, count: 0, inicial: 0 },
                                        interno: { nombre: 'INTERNO/CORTESÍA', icon: '📒', ingresos: 0, egresos: 0, count: 0, inicial: 0 },
                                        otros: { nombre: 'OTROS', icon: '📝', ingresos: 0, egresos: 0, count: 0, inicial: 0 }
                                    };

                                    movimientos.forEach(m => {
                                        const metodoRaw = (m.metodo_pago || '').toLowerCase();
                                        const descripcionRaw = (m.descripcion || '').toLowerCase();
                                        let key = 'otros';
                                        
                                        if (metodoRaw.includes('efectivo')) key = 'efectivo';
                                        else if (metodoRaw.includes('qr') || metodoRaw.includes('debito') || metodoRaw.includes('credito')) key = 'qr';
                                        else if (metodoRaw.includes('transferencia')) key = 'transferencia';
                                        else if (metodoRaw.includes('cortesía') || metodoRaw.includes('cortesia') || metodoRaw.includes('gastos_generales')) key = 'interno';
                                        
                                        const monto = parseFloat(m.monto);
                                        if (monto >= 0) {
                                            totales[key].ingresos += monto;
                                        } else {
                                            totales[key].egresos += Math.abs(monto);
                                        }
                                        totales[key].count += 1;
                                    });
                                    
                                    // Métodos a mostrar
                                    let methodsToShow = ['efectivo', 'qr', 'transferencia', 'interno'];
                                    
                                    // Si no es admin, mostrar solo efectivo e interno
                                    if (!isAdmin) {
                                        methodsToShow = ['efectivo', 'interno'];
                                    }

                                    // Si hay 'otros' con datos, lo agregamos y es admin
                                    if (totales.otros.count > 0 && isAdmin) methodsToShow.push('otros');

                                    return methodsToShow.map(key => {
                                        const t = totales[key];
                                        const balance = t.inicial + t.ingresos - t.egresos;
                                        return (
                                            <div key={key} className="bg-white rounded-lg shadow p-4 border border-gray-100">
                                                <div className="flex items-center gap-2 mb-3 border-b pb-2">
                                                    <span className="text-xl">{t.icon}</span>
                                                    <h4 className="font-bold text-gray-700">{t.nombre}</h4>
                                                </div>
                                                <div className="space-y-1 text-sm">
                                                    {key === 'efectivo' && (
                                                        <div className="flex justify-between text-gray-600">
                                                            <span>Inicio de caja:</span>
                                                            <span>${formatCurrency(t.inicial)}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between text-gray-600">
                                                        <span>Ingresos:</span>
                                                        <span className="text-green-600 font-medium">${formatCurrency(t.ingresos)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-gray-600">
                                                        <span>Egresos:</span>
                                                        <span className="text-red-600 font-medium">${formatCurrency(t.egresos)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center bg-indigo-50 mt-2 p-2 rounded text-indigo-900 font-bold">
                                                        <span>Balance Actual:</span>
                                                        <span className="text-lg">${formatCurrency(balance)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs text-gray-400 pt-1">
                                                        <span>Movimientos:</span>
                                                        <span>{t.count}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Info Panel */}
                            <div className="lg:col-span-1 space-y-6">
                                <div className="bg-white rounded-lg shadow p-6">
                                    <h3 className="text-lg font-semibold mb-4 text-indigo-700">Resumen</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Fecha Apertura:</span>
                                            <span className="font-medium">{new Date(caja.fecha_apertura).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Saldo Inicial:</span>
                                            <span className="font-medium">${formatCurrency(caja.saldo_inicial)}</span>
                                        </div>
                                        <div className="flex justify-between text-lg font-bold border-t pt-3">
                                            <span className="text-gray-800">Saldo Calculado:</span>
                                            <span className="text-green-600">${formatCurrency(calcularSaldoActual())}</span>
                                        </div>
                                        <div className="flex justify-between text-md font-semibold text-indigo-600">
                                            <span>Total Ingresos:</span>
                                            <span>${formatCurrency(calcularIngresosTotales())}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg shadow p-6">
                                    <h3 className="text-lg font-semibold mb-4 text-red-600">Cierre de Caja</h3>
                                    <form onSubmit={handleCerrar}>
                                        <div className="mb-4">
                                            <label className="block text-gray-700 text-sm font-bold mb-2">Saldo Final Real (En Caja)</label>
                                            <input 
                                                type="number" 
                                                step="0.01"
                                                value={saldoFinalReal} 
                                                onChange={(e) => setSaldoFinalReal(e.target.value)}
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                                placeholder={formatCurrency(calcularSaldoActual())}
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Si se deja vacío, se usará el saldo calculado.</p>
                                        </div>
                                        <button type="submit" className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full">
                                            Cerrar Caja
                                        </button>
                                    </form>
                                </div>
                            </div>

                            {/* Movements Table */}
                            <div className="lg:col-span-2">
                                <div className="bg-white rounded-lg shadow overflow-hidden">
                                     <div className="px-6 py-4 border-b border-gray-200">
                                        <h3 className="text-lg font-semibold text-gray-800">Movimientos de la Sesión</h3>
                                    </div>
                                    <div className="md:hidden space-y-4 p-4">
                                        {currentMovimientos.length === 0 ? (
                                            <div className="text-center text-sm text-gray-500">No hay movimientos registrados</div>
                                        ) : (
                                            currentMovimientos.map((mov, index) => (
                                                <div key={index} className="bg-white border rounded-lg shadow-sm p-4 relative">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                            mov.tipo_movimiento === 'VENTA' ? 'bg-green-100 text-green-800' : 
                                                            mov.tipo_movimiento === 'PAGO_TURNO' ? 'bg-blue-100 text-blue-800' : 
                                                            mov.tipo_movimiento === 'INSCRIPCION' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {mov.tipo_movimiento}
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-gray-500">{new Date(mov.fecha).toLocaleTimeString()}</span>
                                                            <button 
                                                                onClick={() => handleVerDetalle(mov)}
                                                                className="text-indigo-600 hover:text-indigo-900"
                                                                title="Ver detalle"
                                                            >
                                                                👁️
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <p className="font-medium text-gray-900 mb-1">{mov.descripcion}</p>
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-gray-500">{mov.metodo_pago}</span>
                                                        <span className="font-bold text-gray-900">${formatCurrency(mov.monto)}</span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Desktop Table for Movements */}
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="min-w-full leading-normal">
                                            <thead>
                                                <tr>
                                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Hora</th>
                                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tipo</th>
                                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Descripción</th>
                                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Método</th>
                                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Monto</th>
                                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentMovimientos.length === 0 ? (
                                                     <tr>
                                                        <td colSpan="6" className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-center">No hay movimientos registrados</td>
                                                    </tr>
                                                ) : (
                                                    currentMovimientos.map((mov, index) => (
                                                        <tr key={index}>
                                                            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                                                {new Date(mov.fecha).toLocaleTimeString()}
                                                            </td>
                                                            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                                    mov.tipo_movimiento === 'VENTA' ? 'bg-green-100 text-green-800' : 
                                                                    mov.tipo_movimiento === 'PAGO_TURNO' ? 'bg-blue-100 text-blue-800' : 
                                                                    mov.tipo_movimiento === 'INSCRIPCION' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'
                                                                }`}>
                                                                    {mov.tipo_movimiento}
                                                                </span>
                                                            </td>
                                                            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{mov.descripcion}</td>
                                                            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{mov.metodo_pago}</td>
                                                            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right font-medium">
                                                                ${formatCurrency(mov.monto)}
                                                            </td>
                                                            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-center">
                                                                <button 
                                                                    onClick={() => handleVerDetalle(mov)}
                                                                    className="text-indigo-600 hover:text-indigo-900 transition-colors bg-indigo-50 p-1.5 rounded-full"
                                                                    title="Ver detalle"
                                                                >
                                                                    👁️
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination Controls */}
                                    {totalPages > 1 && (
                                        <div className="px-5 py-4 bg-white border-t flex flex-col xs:flex-row items-center xs:justify-between">
                                            <span className="text-xs xs:text-sm text-gray-900 mb-2 xs:mb-0">
                                                Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, movimientos.length)} de {movimientos.length}
                                            </span>
                                            <div className="inline-flex mt-2 xs:mt-0">
                                                <button 
                                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                    disabled={currentPage === 1}
                                                    className={`text-sm bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-l ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    Prev
                                                </button>
                                                <div className="flex items-center px-4 bg-gray-100 text-gray-700 font-medium border-t border-b">
                                                    Pág. {currentPage} de {totalPages}
                                                </div>
                                                <button 
                                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                                    disabled={currentPage === totalPages}
                                                    className={`text-sm bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-r ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                </>
            )}

            {tab === 'historial' && (
                <>
                    {/* Mobile Cards for History */}
                    <div className="md:hidden space-y-4">
                        {historial.map((cajas) => (
                            <div key={cajas.id} className="bg-white border rounded-lg shadow-sm p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-gray-900">Caja #{cajas.id}</span>
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        cajas.estado === 'abierta' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {cajas.estado}
                                    </span>
                                </div>
                                <div className="text-sm space-y-1 mb-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Apertura:</span>
                                        <span className="text-gray-900">{new Date(cajas.fecha_apertura).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Cierre:</span>
                                        <span className="text-gray-900">{cajas.fecha_cierre ? new Date(cajas.fecha_cierre).toLocaleString() : '-'}</span>
                                    </div>
                                </div>
                                <div className="border-t pt-2 flex justify-between items-center text-sm">
                                    <div>
                                        <span className="text-gray-500 block text-xs">Inicial</span>
                                        <span className="font-semibold">${formatCurrency(cajas.saldo_inicial)}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-gray-500 block text-xs">Final</span>
                                        <span className="font-semibold">{cajas.saldo_final ? `$${formatCurrency(cajas.saldo_final)}` : '-'}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table for History */}
                    <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full leading-normal">
                            <thead>
                                <tr>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Apertura</th>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cierre</th>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Saldo Inicial</th>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Saldo Final</th>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historial.map((cajas) => (
                                    <tr key={cajas.id}>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">#{cajas.id}</td>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{new Date(cajas.fecha_apertura).toLocaleString()}</td>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{cajas.fecha_cierre ? new Date(cajas.fecha_cierre).toLocaleString() : '-'}</td>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right">${formatCurrency(cajas.saldo_inicial)}</td>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right">{cajas.saldo_final ? `$${formatCurrency(cajas.saldo_final)}` : '-'}</td>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-center">
                                             <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                cajas.estado === 'abierta' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {cajas.estado}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
            {/* Modal de Detalle de Movimiento */}
            {showModal && selectedMov && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowModal(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10 ${
                                        selectedMov.tipo_movimiento === 'VENTA' ? 'bg-green-100' : 
                                        selectedMov.tipo_movimiento === 'INSCRIPCION' ? 'bg-indigo-100' : 'bg-blue-100'
                                    }`}>
                                        <span className="text-xl">
                                            {selectedMov.tipo_movimiento === 'VENTA' ? '🍕' : selectedMov.tipo_movimiento === 'INSCRIPCION' ? '🏆' : '🎾'}
                                        </span>
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-lg leading-6 font-bold text-gray-900" id="modal-title">
                                            {selectedMov.descripcion?.includes('Cortesía') ? 'Detalle de Cortesía' : `Detalle de ${selectedMov.tipo_movimiento.replace('_', ' ')}`}
                                        </h3>
                                        <div className="mt-4 space-y-3 text-sm text-gray-600">
                                            <div className="flex justify-between border-b pb-1">
                                                <span className="font-semibold">Fecha:</span>
                                                <span>{new Date(selectedMov.fecha).toLocaleString()}</span>
                                            </div>
                                            
                                            {selectedMov.tipo_movimiento !== 'VENTA' && !selectedMov.descripcion?.includes('Venta #') && (
                                                <>
                                                    <div className="flex justify-between border-b pb-1">
                                                        <span className="font-semibold">Descripción:</span>
                                                        <span>{selectedMov.descripcion}</span>
                                                    </div>
                                                    {selectedMov.cliente_nombre && (
                                                        <div className="flex justify-between border-b pb-1">
                                                            <span className="font-semibold">{selectedMov.tipo_movimiento === 'INSCRIPCION' || selectedMov.tipo_movimiento === 'INGRESO_CUENTA' ? 'Jugador:' : 'Cliente:'}</span>
                                                            <span className="font-medium text-indigo-700">{selectedMov.cliente_nombre}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between border-b pb-1">
                                                        <span className="font-semibold">Método de Pago:</span>
                                                        <span className="capitalize">{selectedMov.metodo_pago}</span>
                                                    </div>
                                                    <div className="flex justify-between border-b pb-1 text-lg">
                                                        <span className="font-bold text-gray-800">Monto:</span>
                                                        <span className="font-bold text-indigo-700">${formatCurrency(selectedMov.monto)}</span>
                                                    </div>
                                                </>
                                            )}

                                            {loadingDetail ? (
                                                <div className="py-4 text-center">Cargando detalles adicionales...</div>
                                            ) : (
                                                movDetail && (selectedMov.tipo_movimiento === 'VENTA' || selectedMov.descripcion?.includes('Venta #')) && (
                                                    <div className="mt-4 bg-gray-50 p-3 rounded">
                                                        <h4 className="font-bold mb-2 border-b text-indigo-700">Productos de la Venta</h4>
                                                        <table className="min-w-full">
                                                            <thead>
                                                                <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                                    <th className="text-left py-1">Producto</th>
                                                                    <th className="text-center py-1">Cant.</th>
                                                                    <th className="text-right py-1">Subtotal</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {movDetail.map((item, idx) => (
                                                                    <tr key={idx} className="border-t border-gray-200">
                                                                        <td className="py-2">{item.producto_nombre}</td>
                                                                        <td className="py-2 text-center">{item.cantidad}</td>
                                                                        <td className="py-2 text-right">${formatCurrency(item.precio_unitario * item.cantidad)}</td>
                                                                     </tr>
                                                                ))}
                                                            </tbody>
                                                            <tfoot>
                                                                <tr className="border-t-2 border-gray-300 font-bold">
                                                                    <td colSpan="2" className="py-2 text-right">Monto Operación:</td>
                                                                    <td className="py-2 text-right text-indigo-700">${formatCurrency(movDetail.reduce((acc, current) => acc + (current.precio_unitario * current.cantidad), 0))}</td>
                                                                </tr>
                                                            </tfoot>
                                                        </table>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button 
                                    type="button" 
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CajaPage;
