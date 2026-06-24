import { useMemo, useCallback } from "react"
import {
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Line,
} from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { TrendingUp, TrendingDown, Activity, AlertTriangle, CheckCircle2 } from "lucide-react"

/**
 * Formatea un número como moneda local (pesos AR)
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(amount)
}

// Configuración de colores para Recharts
const chartConfig = {
  ingresos: {
    label: "Ingresos",
    color: "#10b981", // Esmeralda premium
  },
  egresos: {
    label: "Gastos",
    color: "#f43f5e", // Rosa / Rojo premium
  },
  neto: {
    label: "Utilidad Neta",
    color: "#3b82f6", // Azul premium
  },
}

export function CashFlowChart({ data, loading }) {
  const hasOriginalData = data && data.length > 0

  // Detección inteligente de vista diaria vs mensual
  const isDailyView = useMemo(() => {
    if (!hasOriginalData) return false
    return data.some((d) => {
      const parts = d.date.split("-")
      return parts.length === 3 && parts[2] !== "01"
    })
  }, [data, hasOriginalData])

  // Formateador inteligente de eje X
  const formatXAxis = useCallback((dateStr) => {
    if (!dateStr || dateStr.includes("padding")) return ""
    const parts = dateStr.split("-")
    if (parts.length < 3) return dateStr

    const [year, month, day] = parts
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10))

    if (isDailyView) {
      // Formato: "22 may"
      return date.toLocaleDateString("es-CL", { day: "numeric", month: "short" })
    } else {
      // Formato: "may 26"
      return date.toLocaleDateString("es-CL", { month: "short", year: "2-digit" })
    }
  }, [isDailyView])

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="h-5 w-40 rounded bg-muted animate-pulse" />
          <div className="h-4 w-56 rounded bg-muted animate-pulse mt-1" />
        </CardHeader>
        <CardContent>
          <div className="h-[320px] flex items-center justify-center">
            <div className="h-full w-full rounded bg-muted/50 animate-pulse" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // PADDING DINÁMICO INTELIGENTE:
  // Si solo hay un punto de datos, Recharts no puede trazar áreas ni líneas continuas (se ven como puntos flotantes).
  // Agregamos un punto anterior con valor cero y un punto posterior con valor cero para crear una transición visual hermosa.
  let chartData = data || []
  if (hasOriginalData && data.length === 1) {
    const singlePoint = data[0]
    const parts = singlePoint.date.split("-")
    const year = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10) - 1
    const day = parts[2] ? parseInt(parts[2], 10) : 1
    const d = new Date(year, month, day)

    if (isDailyView) {
      // Día anterior a cero
      const prevDate = new Date(d)
      prevDate.setDate(prevDate.getDate() - 1)
      const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(prevDate.getDate()).padStart(2, '0')}`

      // Día posterior a cero
      const nextDate = new Date(d)
      nextDate.setDate(nextDate.getDate() + 1)
      const nextKey = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`

      chartData = [
        { date: prevKey, ingresos: 0, egresos: 0, neto: 0, isPadding: true },
        { ...singlePoint },
        { date: nextKey, ingresos: 0, egresos: 0, neto: 0, isPadding: true }
      ]
    } else {
      // Mes anterior a cero
      const prevDate = new Date(d)
      prevDate.setMonth(prevDate.getMonth() - 1)
      const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-01`

      // Mes posterior a cero
      const nextDate = new Date(d)
      nextDate.setMonth(nextDate.getMonth() + 1)
      const nextKey = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-01`

      chartData = [
        { date: prevKey, ingresos: 0, egresos: 0, neto: 0, isPadding: true },
        { ...singlePoint },
        { date: nextKey, ingresos: 0, egresos: 0, neto: 0, isPadding: true }
      ]
    }
  }

  // Calcular acumulados originales del período consultado
  const totalIncome = hasOriginalData ? data.reduce((s, d) => s + d.ingresos, 0) : 0
  const totalExpenses = hasOriginalData ? data.reduce((s, d) => s + d.egresos, 0) : 0
  const netTotal = totalIncome - totalExpenses
  const isProfit = netTotal >= 0

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="size-4 text-muted-foreground" />
              Reporte de Flujo de Caja (Cash Flow)
            </CardTitle>
            <CardDescription className="mt-0.5">
              Muestra la batalla entre lo que entra (ingresos) y lo que sale (gastos)
            </CardDescription>
          </div>
          {hasOriginalData && (
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Ingresos Totales
                </p>
                <p className="text-sm font-bold font-mono text-emerald-500">
                  {formatCurrency(totalIncome)}
                </p>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Gastos Totales
                </p>
                <p className="text-sm font-bold font-mono text-rose-500">
                  {formatCurrency(totalExpenses)}
                </p>
              </div>
              <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 ${isProfit
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-rose-500/10 text-rose-500"
                }`}>
                {isProfit ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
                    Utilidad Neta
                  </p>
                  <p className="text-sm font-bold font-mono">
                    {isProfit ? "+" : ""}{formatCurrency(netTotal)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        {!hasOriginalData ? (
          <div className="h-[320px] flex items-center justify-center text-sm text-muted-foreground">
            Sin datos de flujo de caja en este período.
          </div>
        ) : (
          <>
            <ChartContainer config={chartConfig} className="h-[320px] w-full">
              <ComposedChart data={chartData} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  {/* Gradientes premium con colores HEX estables */}
                  <linearGradient id="fillIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="fillEgresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={formatXAxis}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(val) => `$${val / 1000}k`}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }}
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => (
                        <div className="flex items-center justify-between w-full gap-4">
                          <span className="font-semibold capitalize">
                            {name === "neto" ? "Utilidad Neta" : name === "ingresos" ? "Ingresos" : "Gastos"}:
                          </span>
                          <span className="font-mono">{formatCurrency(value)}</span>
                        </div>
                      )}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />

                {/* Áreas de Ingresos y Egresos */}
                <Area
                  type="monotone"
                  dataKey="ingresos"
                  stroke="#10b981"
                  fill="url(#fillIngresos)"
                  strokeWidth={2}
                  activeDot={{ r: 6 }}
                />
                <Area
                  type="monotone"
                  dataKey="egresos"
                  stroke="#f43f5e"
                  fill="url(#fillEgresos)"
                  strokeWidth={2}
                  activeDot={{ r: 6 }}
                />

                {/* Línea destacada del Resultado Neto */}
                <Line
                  type="monotone"
                  dataKey="neto"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4, stroke: "#3b82f6", strokeWidth: 2, fill: "#1e293b" }}
                  activeDot={{ r: 7 }}
                />
              </ComposedChart>
            </ChartContainer>

            {/* Mensaje de alerta / éxito de Utilidad Neta del Período */}
            <div className={`mt-4 flex items-start gap-3 rounded-lg border px-4 py-3 ${isProfit
                ? "border-emerald-500/30 bg-emerald-500/8 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400"
                : "border-rose-500/30 bg-rose-500/8 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400"
              }`}>
              {isProfit ? (
                <CheckCircle2 className="size-5 shrink-0 mt-0.5 text-emerald-500" />
              ) : (
                <AlertTriangle className="size-5 shrink-0 mt-0.5 text-rose-500 animate-pulse" />
              )}
              <div className="flex flex-col">
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
                  Métrica Clave: Utilidad Neta del Período
                </p>
                <p className="text-lg font-bold leading-tight font-mono mt-0.5">
                  {isProfit ? "+" : ""}{formatCurrency(netTotal)}
                </p>
                <p className="text-xs mt-1 opacity-90 leading-relaxed">
                  {isProfit ? (
                    "¡Superávit! Los ingresos totales superan a los gastos en este período. El flujo de caja del negocio es saludable y sostenible."
                  ) : (
                    <span className="font-semibold">
                      ¡Estás en problemas! La línea roja de gastos cruzó a la verde de ingresos. Tenés déficit operativo, estás gastando más de lo que ingresa.
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Mensaje de contexto en caso de padding */}
            {data.length === 1 && (
              <p className="text-[10px] text-center text-muted-foreground mt-2 italic">
                * Nota: Se aplicó suavizado visual temporal al gráfico para proyectar el área del mes actual.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
