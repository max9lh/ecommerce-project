// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react"
import { parseJwt, isTokenExpired } from "@/utils/parseJwt"
import api from "@/api/api"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mustChangePassword, setMustChangePassword] = useState(false)

  // Inicialización: leer token existente
  useEffect(() => {
    const initAuth = async () => {
      const accessToken = localStorage.getItem("accessToken")
      const mustChange = localStorage.getItem("mustChangePassword") === "true"

      if (accessToken) {
        const payload = parseJwt(accessToken)
        if (payload && !isTokenExpired(payload)) {
          setUser(payload)
          setMustChangePassword(mustChange)
        } else {
          // Token expirado, intentar refresh (cookie HttpOnly viaja sola)
          try {
            const res = await api.post("/auth/refresh")
            const { accessToken: newAccessToken } = res.data.data
            localStorage.setItem("accessToken", newAccessToken)
            setUser(parseJwt(newAccessToken))
            setMustChangePassword(mustChange)
          } catch (err) {
            localStorage.removeItem("accessToken")
            localStorage.removeItem("mustChangePassword")
            setMustChangePassword(false)
          }
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  // Renovar token proactivamente antes de que expire
  useEffect(() => {
    if (!user) return;

    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) return;

    const payload = parseJwt(accessToken);
    if (!payload || !payload.exp) return;

    // Calcular tiempo hasta expiración
    const expiresIn = payload.exp * 1000 - Date.now();

    // Renovar cuando falten 2 minutos
    const refreshTime = expiresIn - (2 * 60 * 1000);

    if (refreshTime > 0) {
      const timeout = setTimeout(async () => {
        try {
          const res = await api.post("/auth/refresh");
          const { accessToken: newAccessToken } = res.data.data;
          localStorage.setItem("accessToken", newAccessToken);
          setUser(parseJwt(newAccessToken));
        } catch (error) {
          console.error('Error refreshing token:', error);
          logout();
        }
      }, refreshTime);

      return () => clearTimeout(timeout);
    }
  }, [user]);

  // Login: guardar accessToken (refreshToken viene como HttpOnly cookie del server)
  const login = useCallback((accessToken, mustChange = false) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('mustChangePassword', mustChange ? 'true' : 'false');
    const payload = parseJwt(accessToken);
    setUser(payload);
    setMustChangePassword(mustChange);
  }, []);

  // Limpiar flag de cambio obligatorio de contraseña
  const clearMustChangePassword = useCallback(() => {
    localStorage.setItem('mustChangePassword', 'false');
    setMustChangePassword(false);
  }, []);

  // Logout: limpiar todo (el server limpia la cookie)
  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Error during logout:', error);
    }

    localStorage.removeItem("accessToken");
    localStorage.removeItem("mustChangePassword");
    setUser(null);
    setMustChangePassword(false);
  }, []);

  // Helpers derivados
  const isAdmin = user?.role === "ADMIN"
  const isEmployee = user?.role === "EMPLOYEE"

  const hasPermission = useCallback(
    (permission) => {
      if (!user) return false
      if (user.role === "ADMIN") return true
      return user.permissions?.[permission] === true
    },
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      isAdmin,
      isEmployee,
      hasPermission,
      login,
      logout,
      loading,
      mustChangePassword,
      clearMustChangePassword,
    }),
    [user, isAdmin, isEmployee, hasPermission, login, logout, loading, mustChangePassword, clearMustChangePassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un <AuthProvider>")
  }
  return context
}
