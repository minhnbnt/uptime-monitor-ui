import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ServerDetail from './pages/ServerDetail';
import ServerCreate from './pages/ServerCreate';
import ServerEdit from './pages/ServerEdit';
import CheckMethodSetup from './pages/CheckMethodSetup';
import ServerSearch from './pages/ServerSearch';
import ServerImportExport from './pages/ServerImportExport';
import ServerHistory from './pages/ServerHistory';
import SettingsNotifications from './pages/SettingsNotifications';
import UserProfile from './pages/UserProfile';

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

          {/* Protected routes with sidebar layout */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/servers/new" element={<ServerCreate />} />
            <Route path="/servers/search" element={<ServerSearch />} />
            <Route path="/servers/import-export" element={<ServerImportExport />} />
            <Route path="/servers/:id" element={<ServerDetail />} />
            <Route path="/servers/:id/edit" element={<ServerEdit />} />
            <Route path="/servers/:id/check-method" element={<CheckMethodSetup />} />
            <Route path="/servers/:id/history" element={<ServerHistory />} />
            <Route path="/settings/notifications" element={<SettingsNotifications />} />
            <Route path="/settings/profile" element={<UserProfile />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
