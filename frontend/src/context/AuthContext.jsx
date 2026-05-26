import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react"
import { parseJwt, isTokenExpired } from "@/utils/parseJwt"

const AuthContext = createContext(null)

/**
 * AuthProvider — Contexto global de autenticación.
 *
 * Al montar, lee el token de localStorage, lo decodifica y verifica
 * que no esté expirado. Expone el usuario, su rol, permisos y
 * funciones de login/logout a toda la app.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // --- Inicialización: leer token existente ---
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      const payload = parseJwt(token)
      if (payload && !isTokenExpired(payload)) {
        setUser(payload)
      } else {
        // Token inválido o expirado → limpiar
        localStorage.removeItem("token")
      }
    }
    setLoading(false)
  }, [])

  // --- Login: guardar token y setear usuario ---
  const login = useCallback((token) => {
    localStorage.setItem("token", token)
    const payload = parseJwt(token)
    setUser(payload)
  }, [])

  // --- Logout: limpiar todo ---
  const logout = useCallback(() => {
    localStorage.removeItem("token")
    setUser(null)
  }, [])

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
