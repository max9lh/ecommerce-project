import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
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
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(value)

const formatMonth = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString("es-AR", { month: "short", year: "2-digit" })
}

export function AccountAreaCard({ title, description, currentAmount, chartData, colorVar, Icon }) {
  const chartConfig = {
    amount: {
      label: "Saldo",
      color: `hsl(var(${colorVar}))`,
    },
  }

  // Calcular variación porcentual respecto al mes anterior
  const prev = chartData.at(-2)?.amount ?? currentAmount
  const pctChange = prev !== 0 ? ((currentAmount - prev) / prev) * 100 : 0
  const isUp = pctChange >= 0

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
        </div>
        <div className="mt-2 flex items-end gap-2">
          <span className="text-3xl font-bold tracking-tight">
            {formatCurrency(currentAmount)}
          </span>
          <span
            className={`mb-1 text-sm font-medium ${isUp ? "text-green-500" : "text-red-500"}`}
          >
            {isUp ? "▲" : "▼"} {Math.abs(pctChange).toFixed(1)}%
          </span>
        </div>
        <p className="text-xs text-muted-foreground">vs. mes anterior</p>
      </CardHeader>

      <CardContent className="flex-1 pb-4">
        <ChartContainer config={chartConfig} className="h-[140px] w-full">
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`gradient-${colorVar}`} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={`hsl(var(${colorVar}))`}
                  stopOpacity={0.35}
                />
                <stop
                  offset="95%"
                  stopColor={`hsl(var(${colorVar}))`}
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
              stroke={`hsl(var(${colorVar}))`}
              strokeWidth={2}
              fill={`url(#gradient-${colorVar})`}
              dot={false}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
