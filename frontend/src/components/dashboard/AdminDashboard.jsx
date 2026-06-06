import { AccountAreaCard } from "@/components/dashboard/account-area-card"
import { NewClosureCard } from "@/components/dashboard/new-closure-card"
import { BudgetBucketsCard } from "@/components/dashboard/budget-buckets-card"
import { RecentActivityCard } from "@/components/dashboard/recent-activity-card"
import { UpcomingExpensesTable } from "@/components/dashboard/upcoming-expenses-table"
import { useDashboard } from "@/hooks/useDashboard"
import { Wallet, Landmark, DollarSign, Loader2 } from "lucide-react"

export function AdminDashboard() {
  const {
    accounts,
    budgetBalances,
    totalBalance,
    getAccountBalance,
    getBudgetBalance,
    upcomingExpenses,
    recentActivity,
    accountHistory,
    loading,
    error,
    refetch,
  } = useDashboard()

  const budgetMerchandise = getBudgetBalance("Mercadería")
  const budgetFixedExpenses = getBudgetBalance("Gastos Fijos")
  const budgetSavings = getBudgetBalance("Ahorro")
  const totalBudget = budgetMerchandise + budgetFixedExpenses + budgetSavings

  const pctMerchandise = totalBudget > 0 ? budgetMerchandise / totalBudget : 0.6
  const pctFixedExpenses = totalBudget > 0 ? budgetFixedExpenses / totalBudget : 0.3
  const pctSavings = totalBudget > 0 ? budgetSavings / totalBudget : 0.1

  const bankBalance = getAccountBalance("bancaria") || getAccountBalance("bank") || getAccountBalance("transferencia")
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
          chartData={accountHistory?.total || []}
          Icon={DollarSign}
        />

        {(loading || bankBalance > 0) && (
          <AccountAreaCard
            title="Cuenta Bancaria"
            description="Saldo disponible en banco"
            currentAmount={loading ? 0 : bankBalance}
            chartData={accountHistory?.bank || []}
            Icon={Landmark}
          />
        )}

        {(loading || cashBalance > 0) && (
          <AccountAreaCard
            title="Efectivo (Caja)"
            description="Dinero en caja física"
            currentAmount={loading ? 0 : cashBalance}
            chartData={accountHistory?.cash || []}
            Icon={Wallet}
          />
        )}

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
