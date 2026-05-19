import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import { ThemeProvider } from './components/theme-provider';
import { ModeToggle } from './components/mode-toggle';
import './App.css'

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="gestor-ui-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          
          <Route path="/login" element={<Login />} />
          
          <Route path="/dashboard" element={
            <div className="min-h-screen bg-background text-foreground p-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <ModeToggle />
              </div>
              <p className="text-muted-foreground">El panel interactivo está en construcción. Usá el botón de arriba a la derecha para alternar entre tema oscuro y claro.</p>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App
