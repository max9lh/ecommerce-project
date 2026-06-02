import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ShieldCheck, AlertTriangle, XCircle, HeartPulse } from "lucide-react"

const formatCurrency = (value) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
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
    <div className={`rounded-xl border ${config.border} ${config.bg} p-4 transition-all hover:shadow-md flex flex-col justify-between`}>
      <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2.5 mb-3 pb-2.5 border-b border-border/10">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`flex size-8 items-center justify-center rounded-lg ${config.bg} shrink-0`}>
            <StatusIcon className={`size-4 ${config.color}`} />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold truncate leading-tight">{item.category}</h4>
            <span className={`text-xs font-semibold ${config.color}`}>{config.label}</span>
          </div>
        </div>
        <div className="text-left xs:text-right shrink-0">
          <p className="text-lg font-bold font-mono whitespace-nowrap leading-none">{formatCurrency(item.currentBalance)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">disponible</p>
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
        <div className="flex items-center justify-between text-[11px] text-muted-foreground gap-2">
          <span className="truncate">
            Gastado: <span className="font-mono font-semibold text-foreground whitespace-nowrap">{formatCurrency(item.totalSpent)}</span>
          </span>
          <span className="truncate text-right">
            Asignado: <span className="font-mono font-semibold text-foreground whitespace-nowrap">{formatCurrency(item.totalAllocated)}</span>
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground gap-2">
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
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <HeartPulse className="size-4 text-muted-foreground" />
              Salud de Bolsas de Presupuesto
            </CardTitle>
            <CardDescription className="mt-0.5">
              Estado de cada bolsa virtual comparado con su asignación histórica
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {!hasData ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No se encontraron bolsas de presupuesto configuradas.
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((item) => (
              <BudgetItem key={item.category} item={item} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
