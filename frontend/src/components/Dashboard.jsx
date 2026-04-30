import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
    const { user } = useAuth();
    const isAdmin = user?.rol === 'admin';

    const allModules = [
        {
            name: 'Reservas Padel',
            path: '/reservas/padel',
            icon: '🎾',
            color: 'bg-blue-500',
            description: 'Gestionar turnos de Padel'
        },
        {
            name: 'Reservas Fútbol',
            path: '/reservas/futbol',
            icon: '🥅',
            color: 'bg-green-500',
            description: 'Gestionar turnos de Fútbol'
        },
        {
            name: 'Jugadores',
            path: '/jugadores',
            icon: '👥',
            color: 'bg-indigo-500',
            description: 'Administrar base de clientes'
        },
        {
            name: 'Ventas',
            path: '/ventas',
            icon: '💰',
            color: 'bg-yellow-500',
            description: 'Registrar ventas de kiosco'
        },
        {
            name: 'Productos',
            path: '/productos',
            icon: '📦',
            color: 'bg-orange-500',
            description: 'Gestionar inventario'
        },
        {
            name: 'Canchas',
            path: '/canchas',
            icon: '⚽',
            color: 'bg-teal-500',
            description: 'Configurar canchas',
            adminOnly: true
        },
        {
            name: 'Configuración',
            path: '/configuracion',
            icon: '⚙️',
            color: 'bg-gray-500',
            description: 'Ajustes del sistema',
            adminOnly: true
        }
    ];

    const modules = allModules.filter(module => !module.adminOnly || isAdmin);

    return (
        <div className="container mx-auto px-4 py-6 md:py-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 md:mb-8">Panel de Control</h1>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {modules.map((module) => (
                    <Link 
                        key={module.name} 
                        to={module.path}
                        className="block group"
                    >
                        <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-gray-100 h-full">
                            <div className="p-4 md:p-6 flex items-center space-x-3 md:space-x-4">
                                <div className={`p-3 md:p-4 rounded-lg text-white text-xl md:text-2xl ${module.color} bg-opacity-90 group-hover:bg-opacity-100 transition-colors flex-shrink-0`}>
                                    {module.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-base md:text-xl font-bold text-gray-800 truncate">{module.name}</h2>
                                    <p className="text-gray-500 text-xs md:text-sm mt-1 line-clamp-2">{module.description}</p>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 md:px-6 py-2 md:py-3 border-t border-gray-100 flex justify-between items-center">
                                <span className="text-indigo-600 font-medium text-xs md:text-sm group-hover:underline">Acceder</span>
                                <span className="text-gray-400 group-hover:translate-x-1 transition-transform">→</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
