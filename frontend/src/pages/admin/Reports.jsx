import { useState, useMemo } from "react"
import { useReports } from "@/hooks/useReports"
import { KpiCards } from "@/components/reports/KpiCards"
import { CashFlowChart } from "@/components/reports/CashFlowChart"
import { ExpensesByCategoryChart } from "@/components/reports/ExpensesByCategoryChart"
import { TopProvidersChart } from "@/components/reports/TopProvidersChart"
import { PayrollTable } from "@/components/reports/PayrollTable"
import { BudgetHealthCard } from "@/components/reports/BudgetHealthCard"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LineChart, RefreshCw, Calendar, Loader2 } from "lucide-react"

/**
 * Calcula las fechas from/to basándose en un preset de período.
 */
function getPresetDates(preset) {
  const now = new Date()
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  let from

  switch (preset) {
    case "last_week":
      from = new Date(to)
      from.setDate(from.getDate() - 7)
      break
    case "last_month":
      from = new Date(to)
      from.setMonth(from.getMonth() - 1)
      break
    case "last_quarter":
      from = new Date(to)
      from.setMonth(from.getMonth() - 3)
      break
    case "last_semester":
      from = new Date(to)
      from.setMonth(from.getMonth() - 6)
      break
    case "last_year":
      from = new Date(to)
      from.setFullYear(from.getFullYear() - 1)
      break
    case "this_month":
      from = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case "this_year":
      from = new Date(now.getFullYear(), 0, 1)
      break
    default:
      from = new Date(to)
      from.setMonth(from.getMonth() - 1)
  }

  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  }
}

const PERIOD_OPTIONS = [
  { value: "last_week", label: "Última semana" },
  { value: "last_month", label: "Último mes" },
  { value: "this_month", label: "Mes actual" },
  { value: "last_quarter", label: "Último trimestre" },
  { value: "last_semester", label: "Último semestre" },
  { value: "this_year", label: "Año actual" },
  { value: "last_year", label: "Último año" },
  { value: "custom", label: "Personalizado" },
]

export default function Reports() {
  const [preset, setPreset] = useState("last_month")
  const [customFrom, setCustomFrom] = useState("")
  const [customTo, setCustomTo] = useState("")

  const { from, to } = useMemo(() => {
    if (preset === "custom" && customFrom && customTo) {
      return { from: customFrom, to: customTo }
    }
    return getPresetDates(preset)
  }, [preset, customFrom, customTo])

  const {
    summary,
    cashFlow,
    expensesByCategory,
    expensesByProvider,
    payroll,
    budgetHealth,
    loading,
    error,
    refetch,
  } = useReports(from, to)

  // Obtener label del período actual para mostrar
  const periodLabel = useMemo(() => {
    const opt = PERIOD_OPTIONS.find((o) => o.value === preset)
    if (preset === "custom" && customFrom && customTo) {
      return `${customFrom} → ${customTo}`
    }
    return opt?.label || "Último mes"
  }, [preset, customFrom, customTo])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-2.5">
            <LineChart className="size-7 text-primary" />
            Reportes Financieros
          </h1>
          <p className="text-muted-foreground mt-1">
            Análisis financiero integral — <span className="font-medium text-foreground">{periodLabel}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Period selector */}
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-muted-foreground shrink-0" />
            <Select value={preset} onValueChange={setPreset}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Seleccionar período" />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={refetch}
            disabled={loading}
            className="shrink-0"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Custom date pickers */}
      {preset === "custom" && (
        <div className="flex items-center gap-3 rounded-lg border border-dashed border-border p-3 bg-accent/20">
          <span className="text-sm text-muted-foreground font-medium shrink-0">Desde:</span>
          <Input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="w-auto"
          />
          <span className="text-sm text-muted-foreground font-medium shrink-0">Hasta:</span>
          <Input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="w-auto"
          />
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <KpiCards summary={summary} loading={loading} />

      {/* Cash Flow Chart — full width */}
      <CashFlowChart data={cashFlow} loading={loading} />

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        <ExpensesByCategoryChart data={expensesByCategory} loading={loading} />
        <TopProvidersChart data={expensesByProvider} loading={loading} />
      </div>

      {/* Budget Health */}
      <BudgetHealthCard data={budgetHealth} loading={loading} />

      {/* Payroll Table */}
      <PayrollTable data={payroll} loading={loading} />

      {/* Footer with counts */}
      {summary && !loading && (
        <div className="flex items-center justify-center gap-6 py-2 text-xs text-muted-foreground">
          <span>
            <span className="font-semibold text-foreground">{summary.closureCount}</span> cierres registrados
          </span>
          <span className="text-border">|</span>
          <span>
            <span className="font-semibold text-foreground">{summary.expenseCount}</span> egresos pagados
          </span>
          <span className="text-border">|</span>
          <span>
            Período: <span className="font-semibold text-foreground">{periodLabel}</span>
          </span>
        </div>
      )}
    </div>
  )
}
