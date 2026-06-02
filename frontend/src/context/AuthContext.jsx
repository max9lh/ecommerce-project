import { parseJwt, isTokenExpired } from "@/utils/parseJwt"
import api from "@/api/api"

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // --- Logout: limpiar todo ---
  const logout = useCallback(() => {
    localStorage.removeItem("token")
    localStorage.removeItem("refresh_token")
    setUser(null)
  }, [])

  // --- Login: guardar token y setear usuario ---
  const login = useCallback((token, refresh_token) => {
    localStorage.setItem("token", token)
    if (refresh_token) localStorage.setItem("refresh_token", refresh_token)
    const payload = parseJwt(token)
    setUser(payload)
  }, [])

  // --- Inicialización: leer token existente y verificar expiración ---
  useEffect(() => {
    const initAuth = async () => {
      let token = localStorage.getItem("token")
      let refresh = localStorage.getItem("refresh_token")
      
      if (token) {
        let payload = parseJwt(token)
        if (payload && !isTokenExpired(payload)) {
          setUser(payload)
        } else if (refresh) {
          try {
            // Intentar refrescar proactivamente al cargar la app
            const res = await api.post("/auth/refresh", { refresh_token: refresh })
            token = res.data.data.token
            refresh = res.data.data.refresh_token
            localStorage.setItem("token", token)
            localStorage.setItem("refresh_token", refresh)
            setUser(parseJwt(token))
          } catch (err) {
            localStorage.removeItem("token")
            localStorage.removeItem("refresh_token")
          }
        } else {
          localStorage.removeItem("token")
        }
      }
      setLoading(false)
    }

    initAuth();
  }, []);

  // --- Helpers derivados ---
  const isAdmin = user?.role === "ADMIN"
  const isEmployee = user?.role === "EMPLOYEE"

  /**
   * Verifica si el usuario tiene un permiso específico.
   * ADMIN siempre retorna true (tiene todos los permisos).
   * EMPLOYEE se verifica contra su objeto de permisos del JWT.
   *
   * @param {string} permission — Nombre del permiso (ej: "canRegisterClosures")
   * @returns {boolean}
   */
  const hasPermission = useCallback(
    (permission) => {
      if (!user) return false
      if (user.role === "ADMIN") return true
      return user.permissions?.[permission] === true
    },
    [user]
  )

  const value = useMemo(
    () => ({
      user,
      isAdmin,
      isEmployee,
      hasPermission,
      login,
      logout,
      loading,
    }),
    [user, isAdmin, isEmployee, hasPermission, login, logout, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook para consumir el contexto de autenticación.
 * @returns {{ user, isAdmin, isEmployee, hasPermission, login, logout, loading }}
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un <AuthProvider>")
  }
  return context
}
