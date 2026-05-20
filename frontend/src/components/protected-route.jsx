import { Navigate } from "react-router-dom"

export function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token")

  if (!token) {
    // Si no hay token en memoria, lo mandamos expulsado al login
    return <Navigate to="/login" replace />
  }

  // Si hay token, lo dejamos ver el componente (ej. Dashboard)
  return children
}
