import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Singup from './pages/Singup';
import { ThemeProvider } from './components/theme-provider';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ProtectedRoute } from './components/protected-route';
import './App.css';

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="gestor-ui-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path='/singup' element={<Singup />}/>   
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight mb-4">Dashboard Principal</h1>
                  <p className="text-muted-foreground">Bienvenido al sistema financiero. Aquí pondremos los widgets y gráficos (Tarea 4.3).</p>
                </div>
              </DashboardLayout>
            </ProtectedRoute>
          } />

        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
