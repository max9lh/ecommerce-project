import { useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ClipboardList,
  ReceiptText,
  CreditCard,
  Building2,
  ShieldCheck,
  ShieldX,
  UserCircle,
} from "lucide-react"

/**
 * Panel operativo del empleado.
 * Muestra un saludo personalizado y tarjetas de acción rápida
 * filtradas según los permisos que tiene asignados.
 */
export function EmployeeDashboard() {
  const { user, hasPermission } = useAuth()
  const navigate = useNavigate()

  // Definimos las acciones posibles y el permiso requerido para cada una
  const actions = [
    {
      title: "Registrar Cierre de Caja",
      description: "Ingresá los ingresos del día desglosados por efectivo y banco.",
      icon: ClipboardList,
      permission: "canRegisterClosures",
      route: "/cierres",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Cargar un Gasto",
      description: "Registrá un nuevo egreso del negocio con su detalle y fecha.",
      icon: ReceiptText,
      permission: "canRegisterExpenses",
      route: "/egresos/nuevo",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      title: "Pagar Factura Pendiente",
      description: "Marcá como pagada una factura que estaba pendiente de pago.",
      icon: CreditCard,
      permission: "canPayExpenses",
      route: "/egresos",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Gestionar Proveedores",
      description: "Agregá, editá o eliminá proveedores del negocio.",
      icon: Building2,
      permission: "canManageProviders",
      route: "/proveedores",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ]

  // Filtrar solo las acciones que el empleado tiene permitidas
  const allowedActions = actions.filter((a) => hasPermission(a.permission))

  // Permisos para el badge visual
  const allPermissions = [
    { key: "canRegisterClosures", label: "Registrar Cierres" },
    { key: "canRegisterExpenses", label: "Cargar Gastos" },
    { key: "canPayExpenses", label: "Pagar Facturas" },
    { key: "canManageProviders", label: "Gestionar Proveedores" },
  ]

  return (
    <div className="space-y-8">
      {/* Header de bienvenida */}
      <div className="flex items-start gap-4">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
          <UserCircle className="size-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            ¡Hola, {user?.username || "Empleado"}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Panel de empleado — Accedé rápidamente a tus tareas del día.
          </p>
        </div>
      </div>

      {/* Tarjetas de acciones rápidas */}
      {allowedActions.length > 0 ? (
        <div>
          <h2 className="text-lg font-semibold mb-4">Acciones Rápidas</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {allowedActions.map((action) => (
              <Card
                key={action.permission}
                className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5"
                onClick={() => navigate(action.route)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">
                      {action.title}
                    </CardTitle>
                    <div
                      className={`flex size-10 items-center justify-center rounded-full ${action.bgColor} ${action.color} transition-transform group-hover:scale-110`}
                    >
                      <action.icon className="size-5" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {action.description}
                  </CardDescription>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 w-full gap-1 text-primary hover:text-primary"
                  >
                    Ir ahora →
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        // Sin permisos
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted mb-4">
              <ShieldX className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Sin permisos asignados</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              Tu cuenta aún no tiene permisos para operar en el sistema.
              Contactá al administrador para que te habilite las funciones necesarias.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Badge de permisos activos */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Tus Permisos</h2>
        <div className="flex flex-wrap gap-2">
          {allPermissions.map((perm) => {
            const active = hasPermission(perm.key)
            return (
              <div
                key={perm.key}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${active
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground"
                  }`}
              >
                {active ? (
                  <ShieldCheck className="size-3.5" />
                ) : (
                  <ShieldX className="size-3.5" />
                )}
                {perm.label}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
