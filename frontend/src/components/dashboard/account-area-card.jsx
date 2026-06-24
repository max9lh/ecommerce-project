import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
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

/**
 * Determina el color CSS del gráfico según la tendencia.
 * - Subida (pctChange >= 0) → azulado (--chart-up)
 * - Bajada (pctChange < 0)  → rojo pastel (--chart-down)
 */
const getTrendColor = (isUp) =>
  isUp ? "var(--chart-up)" : "var(--chart-down)"

export function AccountAreaCard({ title, description, currentAmount, chartData, Icon }) {
  // Calcular variación porcentual respecto al mes anterior
  const prev = chartData.at(-2)?.amount ?? currentAmount
  const pctChange = prev !== 0 ? ((currentAmount - prev) / prev) * 100 : 0
  const isUp = pctChange >= 0

  const trendColor = getTrendColor(isUp)
  const gradientId = `gradient-${title.replace(/[^a-zA-Z0-9]+/g, "-")}-${isUp ? "up" : "down"}`

  const chartConfig = {
    amount: {
      label: "Saldo",
      color: trendColor,
    },
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-1 pt-4 px-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
          </div>
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="size-4" />
          </div>
        </div>
        <div className="mt-1 flex items-end gap-2">
          <span className="text-xl font-bold tracking-tight md:text-2xl">
            {formatCurrency(currentAmount)}
          </span>
          <span
            className={`mb-0.5 text-xs font-medium ${isUp ? "text-blue-500" : "text-rose-400"}`}
          >
            {isUp ? "▲" : "▼"} {Math.abs(pctChange).toFixed(1)}%
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground">vs. mes anterior</p>
      </CardHeader>

      <CardContent className="flex-1 pb-3 px-4 pt-0">
        <ChartContainer config={chartConfig} className="h-[90px] w-full">
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={trendColor}
                  stopOpacity={0.35}
                />
                <stop
                  offset="95%"
                  stopColor={trendColor}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              tickFormatter={formatMonth}
              tick={{ fontSize: 11 }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => formatCurrency(value)}
                  labelFormatter={(label) => formatMonth(label)}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke={trendColor}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
