import React, { useState } from 'react';
import VentaForm from './VentaForm';
import VentaList from './VentaList';

const VentasPage = () => {
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleVentaCreated = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Registrar Venta</h2>
                <VentaForm onVentaCreated={handleVentaCreated} />
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
                <VentaList refreshTrigger={refreshTrigger} />
            </div>
        </div>
    );
};

export default VentasPage;
