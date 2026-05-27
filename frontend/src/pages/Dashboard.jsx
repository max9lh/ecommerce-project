import { useAuth } from "@/context/AuthContext"
import { AdminDashboard } from "@/components/dashboard/AdminDashboard"
import { EmployeeDashboard } from "@/components/dashboard/EmployeeDashboard"

/**
 * Página de Dashboard — renderiza la vista apropiada según el rol del usuario.
 * ADMIN → Dashboard financiero completo con saldos, gráficos y bolsas.
 * EMPLOYEE → Panel operativo con acciones rápidas según permisos.
 */
export default function Dashboard() {
  const { isAdmin } = useAuth()

  if (isAdmin) {
    return <AdminDashboard />
  }

  return <EmployeeDashboard />
}
