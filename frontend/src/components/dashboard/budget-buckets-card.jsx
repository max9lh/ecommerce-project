import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Sparkles, ShoppingCart, Wrench, PiggyBank } from "lucide-react"

const formatCurrency = (value) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(value)

const CATEGORY_META = {
  Mercadería: {
    label: "Mercadería",
    Icon: ShoppingCart,
    colorClass: "bg-chart-1",
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
  const meta = CATEGORY_META[id] || {
    label: id,
    Icon: PiggyBank,
    colorClass: "bg-chart-4",
    textClass: "text-chart-4",
    bgClass: "bg-chart-4/10",
    trackClass: "bg-chart-4/15",
  }
  const available = totalBudget * pct - used
  const allocated = totalBudget * pct
  const usedPct = allocated > 0 ? Math.min((used / allocated) * 100, 100) : 0
  const { label, Icon, colorClass, textClass, bgClass, trackClass } = meta

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`flex size-6 items-center justify-center rounded-md ${bgClass}`}>
            <Icon className={`size-3.5 ${textClass}`} />
          </div>
          <div>
            <p className="text-xs font-semibold leading-tight">{label}</p>
            <p className="text-[11px] text-muted-foreground">{Math.round(pct * 100)}% del ingreso</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-xs font-bold ${textClass}`}>{formatCurrency(available)}</p>
          <p className="text-[11px] text-muted-foreground">disponible</p>
        </div>
      </div>
      <div className={`h-1.5 w-full rounded-full ${trackClass}`}>
        <div
          className={`h-1.5 rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${usedPct}%` }}
        />
      </div>
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>Usado: {formatCurrency(used)}</span>
        <span>Total: {formatCurrency(allocated)}</span>
      </div>
    </div>
  )
}

export function BudgetBucketsCard({
  totalIncome = 0,
  pctMerchandise = 0.6,
  pctFixedExpenses = 0.3,
  pctSavings = 0.1,
  usedMerchandise = 0,
  usedFixedExpenses = 0,
  usedSavings = 0,
  budgetBalances = [],
  totalBalance = 0,
  upcomingExpenses = [],
}) {
  const merchandiseBalance = Number(budgetBalances.find((b) => b.category === "Mercadería")?.balance ?? 0)
  const fixedBalance = Number(budgetBalances.find((b) => b.category === "Gastos Fijos")?.balance ?? 0)
  const savingsBalance = Number(budgetBalances.find((b) => b.category === "Ahorro")?.balance ?? 0)

  const totalUpcoming = upcomingExpenses.reduce((sum, e) => sum + Number(e.amount), 0)

  const totalAllocatedInBudgets = budgetBalances.reduce((sum, b) => sum + Number(b.balance), 0)
  const unallocatedSurplus = Math.max(0, totalBalance - totalAllocatedInBudgets)

  const recommendations = []

  if (merchandiseBalance > 0) {
    recommendations.push({
      title: "Fondo de Stock Activo",
      desc: `Tenés ${formatCurrency(merchandiseBalance)} disponibles en tu bolsa de Mercadería. Podés usarlos hoy mismo para reponer stock de tus productos estrella.`,
      color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      badge: "Reponer Stock",
    })
  }

  const minSignificantSurplus = Math.max(1000, totalIncome * 0.02)
  if (unallocatedSurplus >= minSignificantSurplus) {
    recommendations.push({
      title: "Dinero Libre en Cuentas",
      desc: `Tenés ${formatCurrency(unallocatedSurplus)} sin asignar en caja y banco. Podés comprar mercadería usando este capital directamente sin alterar tus bolsas de presupuesto.`,
      color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      badge: "Dinero Libre",
    })
  }

  if (fixedBalance > totalUpcoming) {
    const surplusFixed = fixedBalance - totalUpcoming
    if (surplusFixed > 0) {
      recommendations.push({
        title: "Excedente en Gastos Fijos",
        desc: `Tus compromisos próximos (${formatCurrency(totalUpcoming)}) están 100% cubiertos por la bolsa de Gastos Fijos. Te sobran ${formatCurrency(surplusFixed)}, los cuales podés destinar a mercadería sin riesgo.`,
        color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        badge: "Usar Excedente",
      })
    }
  }

  const isSavingsHealthy = totalUpcoming > 0 
    ? savingsBalance >= (totalUpcoming * 1.5) 
    : savingsBalance >= (totalIncome * 0.15)

  if (isSavingsHealthy && savingsBalance > 0) {
    const safeInvestment = Math.round(savingsBalance * 0.3)
    recommendations.push({
      title: "Inversión Segura de Ahorros",
      desc: `Tu fondo de Ahorro está sólido con ${formatCurrency(savingsBalance)}. Podés usar hasta el 30% (${formatCurrency(safeInvestment)}) para comprar mercadería de alta rotación sin afectar tu fondo de reserva.`,
      color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      badge: "Inversión Segura",
    })
  }

  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="size-4 text-amber-500 animate-pulse" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold">Asesor de Compra Inteligente</CardTitle>
            <CardDescription className="text-xs">
              Recomendaciones automáticas para reponer stock usando tus fondos seguros
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3 px-4 pb-4 pt-1">
        <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto pr-1 custom-scrollbar max-h-[310px]">
          {recommendations.length > 0 ? (
            recommendations.map((rec, i) => (
              <div key={i} className={`text-[11px] leading-relaxed rounded-lg border p-3 flex flex-col gap-1.5 transition-all duration-300 hover:shadow-sm ${rec.color}`}>
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-foreground">{rec.title}</span>
                  <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-foreground/5 border border-foreground/10 font-bold">
                    {rec.badge}
                  </span>
                </div>
                <p className="text-muted-foreground">{rec.desc}</p>
              </div>
            ))
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-xs text-muted-foreground italic text-center py-12 gap-2">
              <Sparkles className="size-6 text-muted-foreground/40" />
              <p>Tus bolsas están completamente balanceadas.</p>
              <p className="text-[10px] text-muted-foreground/80">No hay excedentes sugeridos para compras extraordinarias en este momento.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
