import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ServerDetail = lazy(() => import('./pages/ServerDetail'));
const ServerCreate = lazy(() => import('./pages/ServerCreate'));
const ServerEdit = lazy(() => import('./pages/ServerEdit'));
const ServerSearch = lazy(() => import('./pages/ServerSearch'));
const ServerImportExport = lazy(() => import('./pages/ServerImportExport'));
const ServerUptimeRange = lazy(() => import('./pages/ServerUptimeRange'));
const SettingsNotifications = lazy(() => import('./pages/SettingsNotifications'));

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>}>{children}</Suspense>;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <SuspenseWrapper>{children}</SuspenseWrapper>;
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
            <Route path="/" element={<SuspenseWrapper><Dashboard /></SuspenseWrapper>} />
            <Route path="/servers/new" element={<SuspenseWrapper><ServerCreate /></SuspenseWrapper>} />
            <Route path="/servers/search" element={<SuspenseWrapper><ServerSearch /></SuspenseWrapper>} />
            <Route path="/servers/import-export" element={<SuspenseWrapper><ServerImportExport /></SuspenseWrapper>} />
            <Route path="/servers/:id" element={<SuspenseWrapper><ServerDetail /></SuspenseWrapper>} />
            <Route path="/servers/:id/edit" element={<SuspenseWrapper><ServerEdit /></SuspenseWrapper>} />
            <Route path="/servers/:id/uptime-range" element={<SuspenseWrapper><ServerUptimeRange /></SuspenseWrapper>} />
            <Route path="/settings/notifications" element={<SuspenseWrapper><SettingsNotifications /></SuspenseWrapper>} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
