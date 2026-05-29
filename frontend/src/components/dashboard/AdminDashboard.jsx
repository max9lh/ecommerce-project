import { AccountAreaCard } from "@/components/dashboard/account-area-card"
import { NewClosureCard } from "@/components/dashboard/new-closure-card"
import { BudgetBucketsCard } from "@/components/dashboard/budget-buckets-card"
import { RecentActivityCard } from "@/components/dashboard/recent-activity-card"
import { UpcomingExpensesTable } from "@/components/dashboard/upcoming-expenses-table"
import { useDashboard } from "@/hooks/useDashboard"
import { Wallet, Landmark, DollarSign, Loader2 } from "lucide-react"

// Datos mock para el gráfico de área (historial) — se reemplazará con /api/closures luego
const mockChartData = [
  { date: "2025-12-01", amount: 180000 },
  { date: "2026-01-01", amount: 210000 },
  { date: "2026-02-01", amount: 195000 },
  { date: "2026-03-01", amount: 240000 },
  { date: "2026-04-01", amount: 228000 },
  { date: "2026-05-01", amount: 260000 },
]

const mockBankData = [
  { date: "2025-12-01", amount: 100000 },
  { date: "2026-01-01", amount: 130000 },
  { date: "2026-02-01", amount: 115000 },
  { date: "2026-03-01", amount: 150000 },
  { date: "2026-04-01", amount: 140000 },
  { date: "2026-05-01", amount: 165000 },
]

const mockCashData = [
  { date: "2025-12-01", amount: 80000 },
  { date: "2026-01-01", amount: 80000 },
  { date: "2026-02-01", amount: 80000 },
  { date: "2026-03-01", amount: 90000 },
  { date: "2026-04-01", amount: 88000 },
  { date: "2026-05-01", amount: 95000 },
]

export function AdminDashboard() {
  const {
    accounts,
    budgetBalances,
    totalBalance,
    getAccountBalance,
    getBudgetBalance,
    upcomingExpenses,
    recentActivity,
    loading,
    error,
    refetch,
  } = useDashboard()

  // Saldos de las bolsas de presupuesto reales
  const budgetMerchandise = getBudgetBalance("Mercadería")
  const budgetFixedExpenses = getBudgetBalance("Gastos Fijos")
  const budgetSavings = getBudgetBalance("Ahorro")
  const totalBudget = budgetMerchandise + budgetFixedExpenses + budgetSavings

  // Porcentajes derivados del saldo actual (para el indicador de capacidad)
  const pctMerchandise = totalBudget > 0 ? budgetMerchandise / totalBudget : 0.6
  const pctFixedExpenses = totalBudget > 0 ? budgetFixedExpenses / totalBudget : 0.3
  const pctSavings = totalBudget > 0 ? budgetSavings / totalBudget : 0.1

  const bankBalance = getAccountBalance("bancaria") || getAccountBalance("bank")
  const cashBalance = getAccountBalance("efectivo") || getAccountBalance("caja") || getAccountBalance("cash")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Panel Principal</h1>
        <p className="text-muted-foreground mt-1">Resumen financiero del negocio.</p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Loading overlay sutil */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Cargando datos del panel…
        </div>
      )}

      {/* Cards de cuentas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
        <AccountAreaCard
          title="Dinero Total"
          description="Suma de todas las cuentas"
          currentAmount={loading ? 0 : totalBalance}
          chartData={mockChartData}
          Icon={DollarSign}
        />

        <AccountAreaCard
          title="Cuenta Bancaria"
          description="Saldo disponible en banco"
          currentAmount={loading ? 0 : bankBalance}
          chartData={mockBankData}
          Icon={Landmark}
        />

        <AccountAreaCard
          title="Efectivo (Caja)"
          description="Dinero en caja física"
          currentAmount={loading ? 0 : cashBalance}
          chartData={mockCashData}
          Icon={Wallet}
        />

        <NewClosureCard />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        <div className="flex flex-col">
          <BudgetBucketsCard
            totalIncome={totalBudget}
            pctMerchandise={pctMerchandise}
            pctFixedExpenses={pctFixedExpenses}
            pctSavings={pctSavings}
            usedMerchandise={0}
            usedFixedExpenses={0}
            usedSavings={0}
            budgetBalances={budgetBalances}
            totalBalance={totalBalance}
            upcomingExpenses={upcomingExpenses}
          />
        </div>

        <div className="flex flex-col">
          <RecentActivityCard
            activities={recentActivity}
            loading={loading}
          />
        </div>
      </div>

      {/* Tabla de vencimientos con acción de pago */}
      <UpcomingExpensesTable
        expenses={upcomingExpenses}
        accounts={accounts}
        onPaid={refetch}
      />
    </div>
  )
}
