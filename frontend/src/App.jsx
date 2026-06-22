import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
<<<<<<< HEAD
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ChangePassword from './pages/ChangePassword';
import Dashboard from './pages/Dashboard';
import Closures from './pages/Closures';
import ClosuresList from './pages/ClosuresList';
import Employees from './pages/Employees';
import AttendanceAdmin from './pages/AttendanceAdmin';
import ProvidersModule from './pages/shared/ProvidersModule';
import Expenses from './pages/shared/ExpensesModule';
import NewExpense from './pages/NewExpense';
import PayExpense from './pages/PayExpense';
=======
import { Loader2 } from 'lucide-react';
>>>>>>> bbcfe4a019fae731e2f373f096b84a2a6bc213a1
import { ThemeProvider } from './components/theme-provider';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ProtectedRoute } from './components/protected-route';
import './App.css';

const Login = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Closures = lazy(() => import('./pages/Closures'));
const ClosuresList = lazy(() => import('./pages/ClosuresList'));
const Employees = lazy(() => import('./pages/Employees'));
const AttendanceAdmin = lazy(() => import('./pages/AttendanceAdmin'));
const ProvidersModule = lazy(() => import('./pages/shared/ProvidersModule'));
const Expenses = lazy(() => import('./pages/shared/ExpensesModule'));
const NewExpense = lazy(() => import('./pages/NewExpense'));
const PayExpense = lazy(() => import('./pages/PayExpense'));
const DistributionSettings = lazy(() => import('./pages/admin/DistributionSettings'));
const AuditLogs = lazy(() => import('./pages/admin/AuditLogs'));
const Reports = lazy(() => import('./pages/admin/Reports'));
const ProjectionChart = lazy(() => import('./pages/admin/ProjectionChart'));
const ChangePassword = lazy(() => import('./pages/ChangePassword'));

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="gestor-ui-theme">
      <BrowserRouter>
        <Suspense fallback={
          <div className="flex h-screen items-center justify-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        }>
          <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
<<<<<<< HEAD
          <Route
            path="/cambiar-contrasena"
=======

          {/* Cambio forzado de contraseña (primer login) */}
          <Route
            path="/cambiar-contrasenia"
>>>>>>> bbcfe4a019fae731e2f373f096b84a2a6bc213a1
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            }
          />

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
            path="/cierres/editar/:id"
            element={
              <ProtectedRoute requiredRole="ADMIN">
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
            path="/reportes"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <DashboardLayout>
                  <Reports />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/proyeccion"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <DashboardLayout>
                  <ProjectionChart />
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
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;

