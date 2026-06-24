import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
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
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { TrendingUp, TrendingDown } from "lucide-react"

const formatCurrency = (value) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(value)

const formatMonth = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString("es-CL", { month: "short", year: "2-digit", timeZone: "UTC" })
}

export function IncomeExpensesChartCard({ chartData, loading }) {
  const chartConfig = {
    ingresos: {
      label: "Ingresos",
      color: "var(--chart-3)", // Emerald Green
    },
    egresos: {
      label: "Egresos",
      color: "var(--chart-5)", // Premium Rose / Red
    },
  }

  // Calcular métricas agregadas del periodo graficado
  const totalIncome = chartData.reduce((sum, item) => sum + (item.ingresos || 0), 0)
  const totalExpenses = chartData.reduce((sum, item) => sum + (item.egresos || 0), 0)
  const netResult = totalIncome - totalExpenses
  const isProfit = netResult >= 0

  return (
    <Card className="flex flex-col justify-between h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Ingresos vs Egresos</CardTitle>
            <CardDescription>Ganancias y pérdidas operativas acumuladas</CardDescription>
          </div>
          <div className={`flex size-10 items-center justify-center rounded-full ${isProfit ? "bg-green-500/10 text-green-500" : "bg-rose-500/10 text-rose-500"
            }`}>
            {isProfit ? <TrendingUp className="size-5" /> : <TrendingDown className="size-5" />}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-4">
        {loading ? (
          <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground font-mono">
            Procesando balances...
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
            Sin operaciones financieras en el periodo.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[220px] w-full">
            <BarChart data={chartData} margin={{ top: 12, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={4}
                tickFormatter={formatMonth}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value / 1000}k`}
                tick={{ fontSize: 10 }}
                width={36}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <div className="flex items-center justify-between w-full gap-4">
                        <span className="font-semibold">{name === "ingresos" ? "Ingresos" : "Egresos"}:</span>
                        <span className="font-mono">{formatCurrency(value)}</span>
                      </div>
                    )}
                    labelFormatter={(label) => formatMonth(label)}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="ingresos"
                fill="var(--chart-3)"
                radius={[4, 4, 0, 0]}
                maxBarSize={30}
              />
              <Bar
                dataKey="egresos"
                fill="var(--chart-5)"
                radius={[4, 4, 0, 0]}
                maxBarSize={30}
              />
            </BarChart>
          </ChartContainer>
        )}

        {/* Bloque de balance neto */}
        <div className={`mt-4 flex items-center gap-3 rounded-lg border px-4 py-3 ${isProfit
          ? "border-green-500/30 bg-green-500/8 dark:bg-green-950/20 text-green-600 dark:text-green-400"
          : "border-rose-500/30 bg-rose-500/8 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400"
          }`}>
          <div className="flex flex-col">
            <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
              Resultado Neto del Periodo
            </p>
            <p className="text-lg font-bold leading-tight font-mono mt-0.5">
              {isProfit ? "+" : ""}{formatCurrency(netResult)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isProfit
                ? "¡Superávit operativo! Tu negocio está generando ganancias netas en este rango de tiempo."
                : "Déficit operativo temporal. Vigila tus deudas a proveedores y optimiza gastos fijos."}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
