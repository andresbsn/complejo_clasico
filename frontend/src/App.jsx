import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CanchaList from './components/CanchaList';
import CanchaForm from './components/CanchaForm';
import ProductosPage from './components/ProductosPage';
import TurnoList from './components/TurnoList';
import TurnoForm from './components/TurnoForm';
import ReservaPage from './components/ReservaPage';
import Layout from './components/Layout';
import VentasPage from './components/VentasPage';
import ConfiguracionPage from './components/ConfiguracionPage';
import JugadoresPage from './components/JugadoresPage';
import ProveedoresPage from './components/ProveedoresPage';
import ReportesPage from './components/ReportesPage';
import Dashboard from './components/Dashboard';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import TorneosPage from './components/TorneosPage';
import TorneoDetailsPage from './components/TorneoDetailsPage';
import CajaPage from './components/CajaPage';
import GastosPage from './components/GastosPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/" element={
            <PrivateRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/canchas" element={
            <PrivateRoute>
              <AdminRoute>
                <Layout>
                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                      <h2 className="text-xl font-semibold mb-4 text-gray-800">Gestionar Canchas</h2>
                      <CanchaForm onCanchaAdded={() => window.location.reload()} />
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                      <CanchaList />
                    </div>
                  </div>
                </Layout>
              </AdminRoute>
            </PrivateRoute>
          } />
          
          <Route path="/productos" element={
            <PrivateRoute>
              <AdminRoute>
                <Layout>
                  <ProductosPage />
                </Layout>
              </AdminRoute>
            </PrivateRoute>
          } />

          <Route path="/proveedores" element={
            <PrivateRoute>
              <AdminRoute>
                <Layout>
                  <ProveedoresPage />
                </Layout>
              </AdminRoute>
            </PrivateRoute>
          } />

          <Route path="/reportes" element={
            <PrivateRoute>
              <Layout>
                <ReportesPage />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/ventas" element={
            <PrivateRoute>
              <Layout>
                <VentasPage />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/reservas/padel" element={
            <PrivateRoute>
              <Layout>
                <ReservaPage type="PADEL" />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/reservas/futbol" element={
            <PrivateRoute>
              <Layout>
                <ReservaPage type="FUTBOL" />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/reservas" element={
            <PrivateRoute>
              <Layout>
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <TurnoForm onTurnoCreated={() => window.location.reload()} />
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <TurnoList />
                  </div>
                </div>
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/configuracion" element={
            <PrivateRoute>
              <AdminRoute>
                <Layout>
                  <ConfiguracionPage />
                </Layout>
              </AdminRoute>
            </PrivateRoute>
          } />

          <Route path="/jugadores" element={
            <PrivateRoute>
              <Layout>
                <JugadoresPage />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/caja" element={
            <PrivateRoute>
              <Layout>
                <CajaPage />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/gastos" element={
            <PrivateRoute>
              <Layout>
                <GastosPage />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/torneos" element={
            <PrivateRoute>
              <Layout>
                <TorneosPage />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/torneos/:id" element={
            <PrivateRoute>
              <Layout>
                <TorneoDetailsPage />
              </Layout>
            </PrivateRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
