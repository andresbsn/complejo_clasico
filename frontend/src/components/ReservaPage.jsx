import React, { useState, useEffect } from 'react';
import { ConfiguracionService, CanchaService, TurnoService } from '../services/api';
import ReservaGrid from './ReservaGrid';
import PagoModal from './PagoModal';
import ReservaModal from './ReservaModal';
import CanchaForm from './CanchaForm';
import { useAuth } from '../context/AuthContext';
import { alerts } from '../utils/alerts';

const ReservaPage = ({ type }) => {
    // type: 'PADEL' or 'FUTBOL' (or whatever matches database 'tipo' and config keys)
    
    const { user } = useAuth();
    const isAdmin = user?.rol === 'admin';

    const [config, setConfig] = useState(null);
    const [canchas, setCanchas] = useState([]);
    const [reservas, setReservas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [modalOpen, setModalOpen] = useState(false);
    const [pagoModalOpen, setPagoModalOpen] = useState(false);
    const [canchaModalOpen, setCanchaModalOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [selectedReserva, setSelectedReserva] = useState(null);

    // Initial Data Fetch
    useEffect(() => {
        fetchData();
    }, [type]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [configData, canchasData] = await Promise.all([
                ConfiguracionService.getAll(),
                CanchaService.getAll({ type }) // Filter by type
            ]);
            setConfig(configData);
            setCanchas(canchasData);
        } catch (error) {
            console.error("Error fetching initial data", error);
        } finally {
            setLoading(false);
        }
    };

    // Reservation Fetch on Date or Canchas change
    useEffect(() => {
        if (!canchas.length) return;
        fetchReservas();
    }, [selectedDate, canchas, type]);

    const fetchReservas = async () => {
        try {
            // Fetch for all canchas of this type
            const allTurnos = await TurnoService.getAll(selectedDate);
            
            // Filter turnos that belong to our current set of canchas
            const canchaIds = canchas.map(c => c.id);
            const filteredTurnos = allTurnos.filter(t => canchaIds.includes(t.cancha_id));
            
            setReservas(filteredTurnos);
        } catch (error) {
            console.error("Error fetching reservas", error);
        }
    };

    const generateTimeSlots = () => {
        if (!config) return [];
        
        const start = config.HORARIO_APERTURA || '14:00';
        const end = config.HORARIO_CIERRE || '24:00';
        const duration = parseInt(type === 'PADEL' ? config.DURACION_PADEL : config.DURACION_FUTBOL) || 60;

        const slots = [];
        let currentTime = new Date(`2000-01-01T${start}`);
        const endTime = new Date(`2000-01-01T${end}`);
        
        // Handle case where end time is smaller than start time (e.g. 02:00 next day)
        if (endTime < currentTime) {
            endTime.setDate(endTime.getDate() + 1);
        }

        while (currentTime < endTime) {
            const slotStart = currentTime.toTimeString().slice(0, 5);
            currentTime.setMinutes(currentTime.getMinutes() + duration);
            const slotEnd = currentTime.toTimeString().slice(0, 5);
            slots.push({ start: slotStart, end: slotEnd });
        }

        return slots;
    };

    const handleSlotClick = (cancha, slot, reserva = null) => {
        if (reserva) {
            // If slot is occupied (has reserva), open PagoModal
            // We need to enrich reserva with cancha_nombre for display if needed
            const reservaWithCancha = { ...reserva, cancha_nombre: cancha.nombre };
            setSelectedReserva(reservaWithCancha);
            setPagoModalOpen(true);
        } else {
            // If empty, open booking modal
            setSelectedSlot({ cancha, slot });
            setModalOpen(true);
        }
    };

    const handleReservaSuccess = () => {
        fetchReservas();
        setModalOpen(false);
        setPagoModalOpen(false);
        setSelectedSlot(null);
        setSelectedReserva(null);
    };

    const handleCanchaAdded = () => {
        fetchData(); // Refresh canchas
        setCanchaModalOpen(false);
    };

    const handleCanchaDeleted = async (id) => {
        const result = await alerts.confirm('¿Eliminar cancha?', '¿Estás seguro de que deseas eliminar esta cancha y todos sus turnos asociados?');
        if (!result.isConfirmed) return;

        try {
            await CanchaService.delete(id);
            alerts.toast('success', 'Cancha eliminada');
            fetchData();
        } catch (error) {
            console.error('Error deleting cancha:', error);
            alerts.error('Error', 'No se pudo eliminar la cancha');
        }
    };

    const isSlotOccupied = (canchaId, startTime) => {
        return reservas.some(r => 
            r.cancha_id === canchaId && 
            r.hora_inicio.slice(0,5) === startTime &&
            r.estado !== 'cancelado' // Exclude cancelled turnos
        );
    };

    const getReservaForSlot = (canchaId, startTime) => {
        // Filter to get all reservas for this slot
        const slotReservas = reservas.filter(r => 
            r.cancha_id === canchaId && 
            r.hora_inicio.slice(0,5) === startTime
        );
        
        // If multiple exist, prioritize non-cancelled ones
        const activeReserva = slotReservas.find(r => r.estado !== 'cancelado');
        
        // Return active one if exists, otherwise return first (could be cancelled)
        return activeReserva || slotReservas[0];
    };

    if (loading && !config) return <div className="p-8 text-center text-gray-500">Cargando...</div>;

    const timeSlots = generateTimeSlots();

    return (
        <div className="space-y-6">
             <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="flex flex-col space-y-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                                Reservas de {type === 'PADEL' ? 'Padel 🎾' : 'Fútbol ⚽'}
                            </h2>
                            <p className="text-xs md:text-sm text-gray-500 mt-1">
                                Duración de turno: {type === 'PADEL' ? config?.DURACION_PADEL : config?.DURACION_FUTBOL} min
                            </p>
                        </div>
                        {isAdmin && (
                            <button
                                onClick={() => setCanchaModalOpen(true)}
                                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none shadow-sm whitespace-nowrap"
                            >
                                + Agregar Cancha
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Fecha:</label>
                        <input 
                            type="date" 
                            value={selectedDate} 
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                        />
                    </div>
                </div>
            </div>

            {config && (
                <ReservaGrid 
                    timeSlots={timeSlots}
                    canchas={canchas}
                    reservas={reservas}
                    onSlotClick={handleSlotClick}
                    isSlotOccupied={isSlotOccupied}
                    getReservaForSlot={getReservaForSlot}
                    selectedDate={selectedDate}
                    isAdmin={isAdmin}
                    onDeleteCancha={handleCanchaDeleted}
                />
            )}

            {modalOpen && selectedSlot && (
                <ReservaModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    slot={selectedSlot}
                    date={selectedDate}
                    config={config}
                    type={type}
                    onSuccess={handleReservaSuccess}
                />
            )}

            {pagoModalOpen && selectedReserva && (
                <PagoModal
                    turno={selectedReserva}
                    onClose={() => setPagoModalOpen(false)}
                    onPagoSuccess={handleReservaSuccess}
                />
            )}

            {/* Modal para Agregar Cancha */}
            {canchaModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto p-6 relative">
                        <button
                            onClick={() => setCanchaModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
                        >
                            <span className="sr-only">Cerrar</span>
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <CanchaForm 
                            onCanchaAdded={handleCanchaAdded} 
                            defaultType={type}
                            onClose={() => setCanchaModalOpen(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReservaPage;
