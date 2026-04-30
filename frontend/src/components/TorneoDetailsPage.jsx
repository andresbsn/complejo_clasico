import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { TorneoService, JugadorService } from '../services/api';
import SearchableSelect from './SearchableSelect';
import { formatCurrency } from '../utils/formatters';
import { alerts } from '../utils/alerts';

const TorneoDetailsPage = () => {
    const { id } = useParams();
    const [torneo, setTorneo] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Inscription Modal State
    const [isInscribeModalOpen, setIsInscribeModalOpen] = useState(false);
    const [jugadores, setJugadores] = useState([]);
    const [selectedJugador, setSelectedJugador] = useState(null);
    const [inscribing, setInscribing] = useState(false);

    // Payment Modal State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedInscripcion, setSelectedInscripcion] = useState(null);
    const [pagos, setPagos] = useState([{ monto: '', metodo: 'efectivo' }]);
    const [paymentJugador, setPaymentJugador] = useState(null);
    const [paying, setPaying] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'paid', 'pending'

    useEffect(() => {
        fetchTorneoDetails();
    }, [id]);

    useEffect(() => {
        if (isInscribeModalOpen || isPaymentModalOpen) {
            fetchJugadores();
        }
    }, [isInscribeModalOpen, isPaymentModalOpen]);

    const fetchTorneoDetails = async () => {
        setLoading(true);
        try {
            const data = await TorneoService.getById(id);
            setTorneo(data);
        } catch (error) {
            console.error('Error fetching torneo details:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchJugadores = async () => {
        try {
            const data = await JugadorService.getAll();
            setJugadores(data);
        } catch (error) {
            console.error('Error fetching jugadores:', error);
        }
    };

    const handleInscribe = async (e) => {
        e.preventDefault();
        if (!selectedJugador) return;
        setInscribing(true);
        try {
            await TorneoService.inscribir(id, selectedJugador.id);
            setIsInscribeModalOpen(false);
            setSelectedJugador(null);
            fetchTorneoDetails();
            alerts.toast('success', 'Jugador inscripto exitosamente');
        } catch (error) {
            alerts.error('Error', error.response?.data?.error || 'Error al inscribir jugador');
        } finally {
            setInscribing(false);
        }
    };

    const handleOpenPayment = (inscripcion) => {
        const pendiente = torneo.costo_inscripcion - (inscripcion.monto_abonado || 0);
        setSelectedInscripcion(inscripcion);
        setPagos([{ 
            monto: pendiente > 0 ? pendiente : '', 
            metodo: 'efectivo',
            jugador_id: inscripcion.jugador_id,
            torneo_id: id 
        }]);
        setPaymentJugador(inscripcion.jugador_id ? { id: inscripcion.jugador_id, nombre: inscripcion.jugador_nombre } : null);
        setIsPaymentModalOpen(true);
    };

    const addPagoRow = () => {
        setPagos([...pagos, { monto: '', metodo: 'efectivo', jugador_id: paymentJugador?.id, torneo_id: id }]);
    };

    const removePagoRow = (index) => {
        if (pagos.length > 1) {
            setPagos(pagos.filter((_, i) => i !== index));
        }
    };

    const handlePagoChange = (index, field, value) => {
        const newPagos = [...pagos];
        newPagos[index][field] = value;
        setPagos(newPagos);
    };

    const handlePayment = async (e) => {
        e.preventDefault();
        
        const totalAbonar = pagos.reduce((sum, p) => sum + parseFloat(p.monto || 0), 0);
        if (totalAbonar <= 0) {
            alerts.warning('Monto inválido', 'El monto total debe ser mayor a 0');
            return;
        }

        const hasCCWithoutJugador = pagos.some(p => p.metodo === 'cuenta_corriente' && !p.jugador_id);
        if (hasCCWithoutJugador) {
            alerts.warning('Información faltante', 'Debe seleccionar un jugador para los pagos con Cuenta Corriente');
            return;
        }

        setPaying(true);
        try {
            await TorneoService.registrarPago(id, selectedInscripcion.id, pagos);
            setIsPaymentModalOpen(false);
            setSelectedInscripcion(null);
            fetchTorneoDetails();
            alerts.toast('success', 'Pago registrado exitosamente');
        } catch (error) {
            alerts.error('Error', 'No se pudo registrar el pago');
        } finally {
            setPaying(false);
        }
    };

    const handleBaja = async (inscripcion) => {
        const result = await alerts.confirm('¿Dar de baja?', `¿Está seguro de dar de baja a ${inscripcion.jugador_nombre}?`);
        if (!result.isConfirmed) return;
        try {
            await TorneoService.darDeBaja(id, inscripcion.id);
            alerts.toast('success', 'Baja registrada');
            fetchTorneoDetails();
        } catch (error) {
            alerts.error('Error', 'No se pudo dar de baja al jugador');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando...</div>;
    if (!torneo) return <div className="p-8 text-center text-red-500">Torneo no encontrado</div>;

    const jugadoresOptions = jugadores.map(j => ({ value: j.id, label: `${j.nombre} (${j.categoria || 'S/C'})` }));

    const filteredInscripciones = torneo.inscripciones?.filter(inscripcion => {
        const matchesName = inscripcion.jugador_nombre.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' 
            ? true 
            : statusFilter === 'paid' 
                ? inscripcion.pagado 
                : !inscripcion.pagado;
        return matchesName && matchesStatus;
    }) || [];

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6">
                <Link to="/torneos" className="text-indigo-600 hover:text-indigo-900 mb-4 inline-block">
                    &larr; Volver a Torneos
                </Link>
                <div className="sm:flex sm:items-center sm:justify-between bg-white px-6 py-5 shadow sm:rounded-lg">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{torneo.descripcion}</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Fecha Inicio: {new Date(torneo.fecha_inicio).toLocaleDateString()}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                            Costo Inscripción: <span className="font-semibold text-gray-900">${formatCurrency(torneo.costo_inscripcion)}</span>
                        </p>
                    </div>
                    <div className="mt-4 sm:mt-0">
                        <button
                            onClick={() => setIsInscribeModalOpen(true)}
                            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
                        >
                            Inscribir Jugador
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-8">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
                    <h2 className="text-lg font-medium text-gray-900">Jugadores Inscriptos</h2>
                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                         <div className="w-full sm:w-48">
                            <select
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">Todos los estados</option>
                                <option value="paid">Pagado</option>
                                <option value="pending">Pendiente</option>
                            </select>
                        </div>
                        <div className="w-full sm:w-64">
                            <input
                                type="text"
                                placeholder="Buscar por nombre..."
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                {/* Mobile Cards View */}
                <div className="md:hidden space-y-4">
                    {filteredInscripciones.length > 0 ? (
                        filteredInscripciones.map((inscripcion) => (
                            <div key={inscripcion.id} className="bg-white shadow rounded-lg p-4 border border-gray-200">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900">{inscripcion.jugador_nombre}</h3>
                                        <p className="text-sm text-gray-500">Categoría: {inscripcion.jugador_categoria || '-'}</p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        {inscripcion.pagado ? (
                                            <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                                                Pagado
                                            </span>
                                        ) : (
                                            <span className="inline-flex rounded-full bg-yellow-100 px-2 text-xs font-semibold leading-5 text-yellow-800">
                                                Pendiente
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <p className="text-sm text-gray-600">
                                        Monto Abonado: <span className="font-semibold text-gray-900">{inscripcion.monto_abonado > 0 ? `$${formatCurrency(inscripcion.monto_abonado)}` : '-'}</span>
                                    </p>
                                </div>
                                <div className="flex justify-end gap-3 mt-4 border-t pt-3">
                                    {!inscripcion.pagado && (!inscripcion.estado || inscripcion.estado === 'inscripto') && (
                                        <button
                                            onClick={() => handleOpenPayment(inscripcion)}
                                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            Cobrar
                                        </button>
                                    )}
                                    {(!inscripcion.estado || inscripcion.estado === 'inscripto') && (
                                        <button
                                            onClick={() => handleBaja(inscripcion)}
                                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                        >
                                            Baja
                                        </button>
                                    )}
                                    {inscripcion.estado === 'baja' && (
                                        <span className="text-red-500 font-medium text-sm self-center">Baja</span>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white shadow rounded-lg p-4 text-center text-gray-500">
                            No hay jugadores inscriptos.
                        </div>
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg bg-white">
                    <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Nombre</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Categoría</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Estado Pago</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Monto Abonado</th>
                                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                    <span className="sr-only">Acciones</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredInscripciones.length > 0 ? (
                                filteredInscripciones.map((inscripcion) => (
                                    <tr key={inscripcion.id}>
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                            {inscripcion.jugador_nombre}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            {inscripcion.jugador_categoria || '-'}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                                            {inscripcion.pagado ? (
                                                <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                                                    Pagado
                                                </span>
                                            ) : (
                                                <span className="inline-flex rounded-full bg-yellow-100 px-2 text-xs font-semibold leading-5 text-yellow-800">
                                                    Pendiente
                                                </span>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            {inscripcion.monto_abonado > 0 ? `$${formatCurrency(inscripcion.monto_abonado)}` : '-'}
                                        </td>
                                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                            {!inscripcion.pagado && (!inscripcion.estado || inscripcion.estado === 'inscripto') && (
                                                <button
                                                    onClick={() => handleOpenPayment(inscripcion)}
                                                    className="text-indigo-600 hover:text-indigo-900 font-semibold"
                                                >
                                                    Cobrar
                                                </button>
                                            )}
                                            {(!inscripcion.estado || inscripcion.estado === 'inscripto') && (
                                                <button
                                                    onClick={() => handleBaja(inscripcion)}
                                                    className="text-red-600 hover:text-red-900 font-semibold ml-4"
                                                >
                                                    Baja
                                                </button>
                                            )}
                                            {inscripcion.estado === 'baja' && (
                                                <span className="text-red-500 font-medium">Baja</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="py-4 text-center text-sm text-gray-500">No hay jugadores inscriptos.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Inscribe Modal */}
            {isInscribeModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsInscribeModalOpen(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full overflow-visible">
                            <form onSubmit={handleInscribe}>
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 overflow-visible">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Inscribir Jugador</h3>
                                    <div className="space-y-4">
                                        <div className="relative">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar Jugador</label>
                                            <SearchableSelect 
                                                options={jugadoresOptions}
                                                value={selectedJugador?.id}
                                                onChange={(option) => setSelectedJugador({ id: option.value })}
                                                placeholder="Seleccionar jugador..."
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="submit"
                                        disabled={inscribing || !selectedJugador}
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                    >
                                        {inscribing ? 'Inscribiendo...' : 'Inscribir'}
                                    </button>
                                    <button
                                        type="button"
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                        onClick={() => setIsInscribeModalOpen(false)}
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {isPaymentModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsPaymentModalOpen(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full overflow-visible">
                            <form onSubmit={handlePayment}>
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 overflow-visible">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">Registrar Pago Inscripción</h3>
                                        <div className="text-right">
                                            <p className="text-sm text-gray-500">Total torneo: <span className="font-bold">${formatCurrency(torneo.costo_inscripcion)}</span></p>
                                            <p className="text-sm text-indigo-600">Pendiente: <span className="font-bold">${formatCurrency(torneo.costo_inscripcion - (selectedInscripcion?.monto_abonado || 0))}</span></p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        {pagos.map((pago, index) => (
                                            <div key={index} className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 relative">
                                                <div className="flex-1">
                                                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Monto</label>
                                                    <input
                                                        type="number"
                                                        required
                                                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                        value={pago.monto}
                                                        onChange={e => handlePagoChange(index, 'monto', e.target.value)}
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Método</label>
                                                    <select
                                                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                        value={pago.metodo}
                                                        onChange={e => handlePagoChange(index, 'metodo', e.target.value)}
                                                    >
                                                        <option value="efectivo">Efectivo</option>
                                                        <option value="transferencia">Transferencia</option>
                                                        <option value="debito">Débito</option>
                                                        <option value="credito">Crédito</option>
                                                        <option value="cuenta_corriente">Cuenta Corriente</option>
                                                    </select>
                                                </div>
                                                {pago.metodo === 'cuenta_corriente' && (
                                                    <div className="flex-[1.5] overflow-visible">
                                                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Cargar a</label>
                                                        <SearchableSelect 
                                                            options={jugadoresOptions}
                                                            value={pago.jugador_id}
                                                            onChange={(option) => handlePagoChange(index, 'jugador_id', option.value)}
                                                            placeholder="Seleccionar..."
                                                        />
                                                    </div>
                                                )}
                                                {pagos.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removePagoRow(index)}
                                                        className="absolute -top-2 -right-2 sm:static sm:mt-6 text-red-500 hover:text-red-700 bg-white rounded-full p-1 shadow sm:shadow-none"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        
                                        <button
                                            type="button"
                                            onClick={addPagoRow}
                                            className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                            Agregar otro medio de pago
                                        </button>

                                        <div className="border-t pt-4 mt-4 flex justify-between items-center bg-indigo-50 p-4 rounded-lg">
                                            <span className="text-base font-bold text-indigo-900">Total a Pagar:</span>
                                            <span className="text-xl font-black text-indigo-900">${formatCurrency(pagos.reduce((sum, p) => sum + parseFloat(p.monto || 0), 0))}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="submit"
                                        disabled={paying}
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                    >
                                        {paying ? 'Registrando...' : 'Confirmar Pagos'}
                                    </button>
                                    <button
                                        type="button"
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                        onClick={() => setIsPaymentModalOpen(false)}
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TorneoDetailsPage;
