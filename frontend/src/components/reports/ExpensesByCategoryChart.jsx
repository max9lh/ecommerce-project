import { PieChart, Pie, Cell } from "recharts"
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
import { PieChart as PieIcon } from "lucide-react"

const formatCurrency = (value) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(value)

// Colores HEX seguros para SVG (oklch no funciona en SVG fill/stroke)
const CATEGORY_COLORS = {
  "Mercadería": "#4d8ef7",
  "Gastos Fijos": "#ef6461",
  "Ahorro": "#48c78e",
}

const FALLBACK_COLORS = ["#f0a04b", "#9b72cf", "#4ec5c1"]

export function ExpensesByCategoryChart({ data, loading }) {
  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="h-5 w-44 rounded bg-muted animate-pulse" />
          <div className="h-4 w-56 rounded bg-muted animate-pulse mt-1" />
        </CardHeader>
        <CardContent>
          <div className="h-[280px] flex items-center justify-center">
            <div className="size-48 rounded-full bg-muted/50 animate-pulse" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const hasData = data && data.length > 0
  const total = hasData ? data.reduce((s, d) => s + d.amount, 0) : 0

  // Preparar datos con colores
  const chartData = hasData
    ? data.map((item, idx) => ({
        ...item,
        fill: CATEGORY_COLORS[item.category] || FALLBACK_COLORS[idx % FALLBACK_COLORS.length],
      }))
    : []

  // Config para ChartContainer
  const chartConfig = {}
  chartData.forEach((item) => {
    chartConfig[item.category] = {
      label: item.category,
      color: item.fill,
    }
  })

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <PieIcon className="size-4 text-muted-foreground" />
          Egresos por Categoría
        </CardTitle>
        <CardDescription>Distribución de gastos pagados por bolsa de presupuesto</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 pb-4">
        {!hasData ? (
          <div className="h-[280px] flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <PieIcon className="size-10 opacity-20" />
            <p>Sin egresos registrados en este período.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-5">
            {/* Donut chart */}
            <ChartContainer config={chartConfig} className="h-[220px] w-full max-w-[300px]">
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => (
                        <div className="flex items-center justify-between w-full gap-3">
                          <span className="font-semibold">{name}:</span>
                          <span className="font-mono">{formatCurrency(value)}</span>
                        </div>
                      )}
                    />
                  }
                />
                <Pie
                  data={chartData}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  strokeWidth={0}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                {/* Total al centro */}
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  <tspan
                    x="50%"
                    dy="-8"
                    fontSize="10"
                    fill="#888"
                    fontWeight="600"
                    letterSpacing="0.05em"
                  >
                    TOTAL
                  </tspan>
                  <tspan
                    x="50%"
                    dy="20"
                    fontSize="15"
                    fontWeight="700"
                    fill="#fff"
                    fontFamily="monospace"
                  >
                    {formatCurrency(total)}
                  </tspan>
                </text>
              </PieChart>
            </ChartContainer>

            {/* Leyenda detallada */}
            <div className="w-full space-y-2 px-1">
              {chartData.map((item) => (
                <div
                  key={item.category}
                  className="flex items-center justify-between rounded-lg border border-border/50 px-3.5 py-2.5 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="size-3 rounded-full shrink-0"
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className="text-sm font-medium">{item.category}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono font-semibold">
                      {formatCurrency(item.amount)}
                    </span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-semibold">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
