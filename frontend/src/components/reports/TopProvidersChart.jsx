import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Building2 } from "lucide-react"

const formatCurrency = (value) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(value)

// Paleta de colores hex para las barras de cada proveedor
const BAR_COLORS = [
  "#4d8ef7", "#6c5ce7", "#48c78e", "#f0a04b", "#ef6461",
  "#4ec5c1", "#9b72cf", "#e17055", "#00b894", "#fd79a8",
]

const chartConfig = {
  amount: {
    label: "Monto Pagado",
    color: "#4d8ef7",
  },
}

export function TopProvidersChart({ data, loading }) {
  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="h-5 w-44 rounded bg-muted animate-pulse" />
          <div className="h-4 w-56 rounded bg-muted animate-pulse mt-1" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 rounded bg-muted/50 animate-pulse" style={{ width: `${90 - i * 15}%` }} />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const hasData = data && data.length > 0
  const total = hasData ? data.reduce((s, d) => s + d.amount, 0) : 0

  // Si no hay datos, mostrar estado vacío bonito
  if (!hasData) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Building2 className="size-4 text-muted-foreground" />
            Top Proveedores
          </CardTitle>
          <CardDescription>Concentración de gasto por proveedor</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-4">
          <div className="h-[280px] flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <Building2 className="size-10 opacity-20" />
            <p>Sin egresos a proveedores en este período.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Enfoque sin Recharts: barras HTML custom para mejor control visual
  const maxAmount = Math.max(...data.map((d) => d.amount))

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Building2 className="size-4 text-muted-foreground" />
              Top Proveedores
            </CardTitle>
            <CardDescription className="mt-0.5">Concentración de gasto por proveedor</CardDescription>
          </div>
          <div className="text-left xs:text-right shrink-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Total
            </p>
            <p className="text-sm font-bold font-mono whitespace-nowrap">{formatCurrency(total)}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-2">
        <div className="space-y-3">
          {data.map((item, idx) => {
            const widthPct = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0
            const color = BAR_COLORS[idx % BAR_COLORS.length]

            return (
              <div key={item.providerId} className="space-y-1.5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div
                      className="size-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm font-medium truncate">
                      {item.providerName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-sm font-mono font-semibold whitespace-nowrap">
                      {formatCurrency(item.amount)}
                    </span>
                    <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-semibold min-w-[40px] text-center">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="h-2.5 w-full rounded-full bg-muted/50 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${Math.max(widthPct, 3)}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
