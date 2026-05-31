import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  PiggyBank,
  BarChart3,
  Clock,
} from "lucide-react"

const formatCurrency = (value) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(value)

function KpiCard({ title, value, change, icon: Icon, format = "currency", invertColor = false }) {
  const isPositive = change > 0
  // Para egresos, subir es malo (invertColor = true)
  const isGood = invertColor ? !isPositive : isPositive
  const TrendIcon = isPositive ? TrendingUp : TrendingDown

  const displayValue = format === "currency"
    ? formatCurrency(value)
    : format === "percent"
      ? `${value}%`
      : `${value}h`

  return (
    <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-border/60">
      {/* Gradient accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] ${
        isGood 
          ? "bg-gradient-to-r from-emerald-500 to-emerald-400" 
          : "bg-gradient-to-r from-rose-500 to-rose-400"
      }`} />
      
      <CardContent className="pt-5 pb-4 px-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2.5 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {title}
            </p>
            <p className="text-2xl font-bold tracking-tight font-mono leading-none">
              {displayValue}
            </p>
          </div>
          <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
            isGood 
              ? "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/15" 
              : "bg-rose-500/10 text-rose-500 dark:bg-rose-500/15"
          }`}>
            <Icon className="size-5" />
          </div>
        </div>

        {/* Change indicator */}
        {change !== undefined && change !== null && (
          <div className="mt-3 flex items-center gap-1.5">
            <div className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
              isGood
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
            }`}>
              <TrendIcon className="size-3" />
              {Math.abs(change).toFixed(1)}%
            </div>
            <span className="text-xs text-muted-foreground">vs período anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function KpiCards({ summary, loading }) {
  if (loading || !summary) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 sm:gap-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-5 pb-4 px-5">
              <div className="space-y-3">
                <div className="h-3 w-24 rounded bg-muted" />
                <div className="h-7 w-32 rounded bg-muted" />
                <div className="h-4 w-20 rounded bg-muted" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 sm:gap-5">
      <KpiCard
        title="Ingresos Totales"
        value={summary.totalIncome}
        change={summary.changes.income}
        icon={DollarSign}
      />
      <KpiCard
        title="Egresos Totales"
        value={summary.totalExpenses}
        change={summary.changes.expenses}
        icon={Receipt}
        invertColor
      />
      <KpiCard
        title="Utilidad Neta"
        value={summary.netProfit}
        change={summary.changes.netProfit}
        icon={PiggyBank}
      />
      <KpiCard
        title="Margen Neto"
        value={summary.margin}
        format="percent"
        icon={BarChart3}
        change={null}
      />
      <KpiCard
        title="Costo Nómina"
        value={summary.totalPayroll}
        icon={Clock}
        change={null}
      />
    </div>
  )
}
