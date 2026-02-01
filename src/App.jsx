import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

// CONTEXTES
import { AuthProvider, useAuth } from './context/AuthContext';
import { NavigationProvider } from './context/NavigationContext'; // ✅ Ajouté pour la navigation intelligente

// LAYOUT (Le nouveau wrapper intelligent)
import MainLayout from './components/layout/Layout';

// PAGES AUTH
import Login from './pages/auth/Login';

// PAGES DASHBOARD
import DashboardGeneral from './pages/dashboard/DashboardGeneral';

import DashboardFinance from './pages/finance/DashboardFinance';
import FinanceHistory from './pages/finance/FinanceHistory';

import DashboardBusiness from './pages/business/DashboardBusiness';

import DashboardPersonal from './pages/personal/DashboardPersonal';

// SÉCURITÉ
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Chargement...
      </div>
    );
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        {/* ✅ On enveloppe tout avec le NavigationProvider pour que les liens intelligents marchent */}
        <NavigationProvider>
          <Routes>
            {/* Route Publique */}
            <Route path="/login" element={<Login />} />

            {/* Routes Privées */}
            <Route
              element={
                <PrivateRoute>
                  <MainLayout />
                </PrivateRoute>
              }
            >
              {/* 1. Dashboard (Racine) */}
              <Route path="/" element={<DashboardGeneral />} />

              {/* 2. Finance */}
              <Route path="/finance" element={<DashboardFinance />} />
              <Route path="/finance/history" element={<FinanceHistory />} />

              {/* 3. Business */}
              <Route path="/business" element={<DashboardBusiness />} />

              {/* 4. Personal */}
              <Route path="/personal" element={<DashboardPersonal />} />
            </Route>
          </Routes>
        </NavigationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
