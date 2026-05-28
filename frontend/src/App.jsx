import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Closures from './pages/Closures';
import ClosuresList from './pages/ClosuresList';
import Employees from './pages/Employees';
import AttendanceAdmin from './pages/AttendanceAdmin';
import ProvidersModule from './pages/shared/ProvidersModule';
import Expenses from './pages/shared/ExpensesModule';
import NewExpense from './pages/NewExpense';
import PayExpense from './pages/PayExpense';
import { ThemeProvider } from './components/theme-provider';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ProtectedRoute } from './components/protected-route';
import DistributionSettings from './pages/admin/DistributionSettings';
import AuditLogs from './pages/admin/AuditLogs';
import './App.css';

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="gestor-ui-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />

          {/* Rutas protegidas dentro del layout */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/cierres"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <DashboardLayout>
                  <ClosuresList />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/cierres/nuevo"
            element={
              <ProtectedRoute requiredPermission="canRegisterClosures">
                <DashboardLayout>
                  <Closures />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/empleados"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <DashboardLayout>
                  <Employees />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/asistencia"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <DashboardLayout>
                  <AttendanceAdmin />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/proveedores"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ProvidersModule />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/distribucion"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <DashboardLayout>
                  <DistributionSettings />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/auditoria"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <DashboardLayout>
                  <AuditLogs />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/egresos"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Expenses />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/egresos/nuevo"
            element={
              <ProtectedRoute requiredPermission="canRegisterExpenses">
                <DashboardLayout>
                  <NewExpense />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/egresos/pagar"
            element={
              <ProtectedRoute requiredPermission="canPayExpenses">
                <DashboardLayout>
                  <PayExpense />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;

