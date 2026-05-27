import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ShoppingCart, Wrench, PiggyBank, Zap } from "lucide-react"

const formatCurrency = (value) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(value)

// Mapeo visual por categoría
const CATEGORY_META = {
  Mercadería: {
    label: "Mercadería",
    Icon: ShoppingCart,
    colorClass: "bg-chart-1",          // barra
    textClass: "text-chart-1",
    bgClass: "bg-chart-1/10",
    trackClass: "bg-chart-1/15",
  },
  gastos_fijos: {
    label: "Gastos Fijos",
    Icon: Wrench,
    colorClass: "bg-chart-2",
    textClass: "text-chart-2",
    bgClass: "bg-chart-2/10",
    trackClass: "bg-chart-2/15",
  },
  Ahorro: {
    label: "Ahorro",
    Icon: PiggyBank,
    colorClass: "bg-chart-3",
    textClass: "text-chart-3",
    bgClass: "bg-chart-3/10",
    trackClass: "bg-chart-3/15",
  },
}

function BudgetBucket({ id, pct, totalBudget, used }) {
  const meta = CATEGORY_META[id]
  const available = totalBudget * pct - used
  const allocated = totalBudget * pct
  const usedPct = allocated > 0 ? Math.min((used / allocated) * 100, 100) : 0
  const { label, Icon, colorClass, textClass, bgClass, trackClass } = meta

  return (
    <div className="flex flex-col gap-3">
      {/* Encabezado de la bolsa */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`flex size-7 items-center justify-center rounded-md ${bgClass}`}>
            <Icon className={`size-4 ${textClass}`} />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">{label}</p>
            <p className="text-xs text-muted-foreground">{Math.round(pct * 100)}% del ingreso</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-sm font-bold ${textClass}`}>{formatCurrency(available)}</p>
          <p className="text-xs text-muted-foreground">disponible</p>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className={`h-2 w-full rounded-full ${trackClass}`}>
        <div
          className={`h-2 rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${usedPct}%` }}
        />
      </div>

      {/* Pie: usado vs total */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Usado: {formatCurrency(used)}</span>
        <span>Total: {formatCurrency(allocated)}</span>
      </div>
    </div>
  )
}

/**
 * Props:
 *  - totalIncome: number  — suma total de ingresos del período
 *  - pctMerchandise: number (0–1)
 *  - pctFixedExpenses: number (0–1)
 *  - pctSavings: number (0–1)
 *  - usedMerchandise: number
 *  - usedFixedExpenses: number
 *  - usedSavings: number
 */
export function BudgetBucketsCard({
  totalIncome = 0,
  pctMerchandise = 0.6,
  pctFixedExpenses = 0.3,
  pctSavings = 0.1,
  usedMerchandise = 0,
  usedFixedExpenses = 0,
  usedSavings = 0,
}) {
  const buckets = [
    { id: "Mercadería", pct: pctMerchandise, used: usedMerchandise },
    { id: "gastos_fijos", pct: pctFixedExpenses, used: usedFixedExpenses },
    { id: "Ahorro", pct: pctSavings, used: usedSavings },
  ]

  const merchandiseAvailable = totalIncome * pctMerchandise - usedMerchandise

  return (
    <Card className="col-span-1 md:col-span-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Estado de Bolsas de Presupuesto</CardTitle>
        <CardDescription>
          Distribución del ingreso total de{" "}
          <span className="font-medium text-foreground">{formatCurrency(totalIncome)}</span> según
          tus porcentajes configurados
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">

        {/* 💡 Indicador de Capacidad de Compra */}
        <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/8 px-4 py-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-green-500/15 text-green-500">
            <Zap className="size-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              Capacidad de compra disponible hoy
            </p>
            <p className="text-base font-semibold leading-tight">
              Podés gastar hasta{" "}
              <span className="text-lg font-bold text-green-500">
                {formatCurrency(Math.max(merchandiseAvailable, 0))}
              </span>{" "}
              en mercadería sin tocar el dinero del arriendo.
            </p>
          </div>
        </div>

        {/* Bolsas */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:divide-border">
          {buckets.map((b, i) => (
            <div key={b.id} className={i > 0 ? "sm:pl-6" : ""}>
              <BudgetBucket
                id={b.id}
                pct={b.pct}
                totalBudget={totalIncome}
                used={b.used}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
