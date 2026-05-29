import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ShieldCheck, AlertTriangle, XCircle, HeartPulse } from "lucide-react"

const formatCurrency = (value) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(value)

const STATUS_CONFIG = {
  healthy: {
    label: "Saludable",
    icon: ShieldCheck,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
    border: "border-emerald-500/30",
    barColor: "bg-emerald-500",
  },
  warning: {
    label: "Precaución",
    icon: AlertTriangle,
    color: "text-amber-500",
    bg: "bg-amber-500/10 dark:bg-amber-500/15",
    border: "border-amber-500/30",
    barColor: "bg-amber-500",
  },
  critical: {
    label: "Crítico",
    icon: XCircle,
    color: "text-rose-500",
    bg: "bg-rose-500/10 dark:bg-rose-500/15",
    border: "border-rose-500/30",
    barColor: "bg-rose-500",
  },
}

function BudgetItem({ item }) {
  const config = STATUS_CONFIG[item.status]
  const StatusIcon = config.icon
  const usageWidth = Math.min(100, item.usagePercent)

  return (
    <div className={`rounded-xl border ${config.border} ${config.bg} p-4 transition-all hover:shadow-md`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`flex size-8 items-center justify-center rounded-lg ${config.bg}`}>
            <StatusIcon className={`size-4 ${config.color}`} />
          </div>
          <div>
            <h4 className="text-sm font-semibold">{item.category}</h4>
            <span className={`text-xs font-semibold ${config.color}`}>{config.label}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold font-mono">{formatCurrency(item.currentBalance)}</p>
          <p className="text-xs text-muted-foreground">disponible</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
          <div
            className={`h-full rounded-full ${config.barColor} transition-all duration-700 ease-out`}
            style={{ width: `${usageWidth}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Gastado: <span className="font-mono font-semibold text-foreground">{formatCurrency(item.totalSpent)}</span>
          </span>
          <span>
            Asignado: <span className="font-mono font-semibold text-foreground">{formatCurrency(item.totalAllocated)}</span>
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Consumido: <span className="font-mono font-semibold">{item.usagePercent}%</span>
          </span>
          <span>
            Restante: <span className={`font-mono font-semibold ${config.color}`}>{item.remainingPercent}%</span>
          </span>
        </div>
      </div>
    </div>
  )
}

export function BudgetHealthCard({ data, loading }) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="h-5 w-44 rounded bg-muted animate-pulse" />
          <div className="h-4 w-56 rounded bg-muted animate-pulse mt-1" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 rounded-xl bg-muted/50 animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const hasData = data && data.length > 0
  const criticalCount = data.filter((d) => d.status === "critical").length
  const warningCount = data.filter((d) => d.status === "warning").length

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <HeartPulse className="size-4 text-muted-foreground" />
              Salud de Bolsas de Presupuesto
            </CardTitle>
            <CardDescription className="mt-0.5">
              Estado de cada bolsa virtual comparado con su asignación histórica
            </CardDescription>
          </div>
          {hasData && (criticalCount > 0 || warningCount > 0) && (
            <div className="flex items-center gap-2">
              {criticalCount > 0 && (
                <span className="flex items-center gap-1 text-xs font-semibold text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded-full">
                  <XCircle className="size-3" /> {criticalCount} crítico{criticalCount > 1 ? "s" : ""}
                </span>
              )}
              {warningCount > 0 && (
                <span className="flex items-center gap-1 text-xs font-semibold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full">
                  <AlertTriangle className="size-3" /> {warningCount} precaución
                </span>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {!hasData ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No se encontraron bolsas de presupuesto configuradas.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {data.map((item) => (
              <BudgetItem key={item.category} item={item} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
