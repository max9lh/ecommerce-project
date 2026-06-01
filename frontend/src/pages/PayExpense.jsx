import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "@/api/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  CreditCard,
  Loader2,
  Clock,
  CircleDollarSign,
  AlertCircle,
  CheckCircle2,
  Search,
} from "lucide-react"

export default function PayExpense() {
  const navigate = useNavigate()

  const [pendingExpenses, setPendingExpenses] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  const [searchQuery, setSearchQuery] = useState("")

  // Diálogo de Pago
  const [selectedExpense, setSelectedExpense] = useState(null)
  const [payAccountId, setPayAccountId] = useState("")
  const [submittingPay, setSubmittingPay] = useState(false)
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false)

  const fetchPendingData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [expRes, accRes] = await Promise.all([
        api.get("/expenses", { params: { status: "Pendiente" } }),
        api.get("/accounts"),
      ])

      const expensesList = expRes.data ?? []
      const accList = accRes.data.data ?? accRes.data ?? []

      setPendingExpenses(expensesList)
      setAccounts(accList)
    } catch (err) {
      setError(err.response?.data?.message || "Error al cargar la información de pagos.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingData()
  }, [])

  const openPayDialog = (expense) => {
    setSelectedExpense(expense)
    // Pre-seleccionar la cuenta sugerida del egreso, o la primera cuenta disponible
    setPayAccountId(
      expense.account_id
        ? String(expense.account_id)
        : accounts.length > 0
        ? String(accounts[0].id)
        : ""
    )
    setIsPayDialogOpen(true)
  }

  const handleConfirmPayment = async () => {
    if (!selectedExpense) return
    if (!payAccountId) {
      setError("Debes seleccionar una cuenta física o banco.")
      return
    }

    setSubmittingPay(true)
    setError(null)
    setSuccessMsg(null)

    try {
      await api.put(`/expenses/${selectedExpense.id}/pay`, {
        account_id: parseInt(payAccountId, 10),
      })

      setIsPayDialogOpen(false)
      setSuccessMsg(
        `¡Pago asertado! Se liquidaron $${parseFloat(selectedExpense.amount).toFixed(
          2
        )} de la factura de "${selectedExpense.provider?.name || "Particular"}"`
      )
      setSelectedExpense(null)

      // Recargar lista
      const expRes = await api.get("/expenses", { params: { status: "Pendiente" } })
      setPendingExpenses(expRes.data ?? [])
    } catch (err) {
      setError(err.response?.data?.message || "Ocurrió un error al procesar el pago.")
    } finally {
      setSubmittingPay(false)
    }
  }

  // Filtrar egresos pendientes según la búsqueda del usuario (nombre de proveedor o categoría)
  const filteredExpenses = pendingExpenses.filter((exp) => {
    const query = searchQuery.toLowerCase()
    const providerName = (exp.provider?.name || "").toLowerCase()
    const category = (exp.budget_category || "").toLowerCase()
    return providerName.includes(query) || category.includes(query)
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/dashboard")}
          className="shrink-0"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pagar Facturas</h1>
          <p className="text-sm text-muted-foreground">
            Liquidá egresos pendientes de pago debitando de las cuentas del negocio.
          </p>
        </div>
      </div>

      {/* Success banner */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive font-semibold">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Caja de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar por proveedor o categoría..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Lista de facturas pendientes */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
                <CreditCard className="size-5" />
              </div>
              <div>
                <CardTitle className="text-base">Facturas Pendientes</CardTitle>
                <CardDescription>
                  Se muestran los egresos en estado pendiente de pago.
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="font-mono text-sm px-2 py-0.5">
              {filteredExpenses.length} pendientes
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-2">
          {filteredExpenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-muted mb-3">
                <Clock className="size-6 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold">No hay facturas pendientes</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Buen trabajo. Todos los egresos registrados están saldados o no hay coincidencias con la búsqueda.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border rounded-lg border">
              {filteredExpenses.map((expense) => {
                const dDate = new Date(expense.due_date)
                const dueDateLocalMidnight = new Date(
                  dDate.getFullYear(),
                  dDate.getMonth(),
                  dDate.getDate()
                )
                const todayLocalMidnight = new Date()
                todayLocalMidnight.setHours(0, 0, 0, 0)

                const diffDays = Math.round(
                  (dueDateLocalMidnight - todayLocalMidnight) / (1000 * 60 * 60 * 24)
                )
                const isUrgent = diffDays <= 3

                return (
                  <div
                    key={expense.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 py-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                          isUrgent
                            ? "bg-red-500/10 text-red-500"
                            : "bg-amber-500/10 text-amber-500"
                        }`}
                      >
                        <CircleDollarSign className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {expense.provider?.name || "Proveedor Particular"}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <Badge variant="outline" className="px-1.5 py-0 text-[10px] uppercase font-semibold">
                            {expense.budget_category}
                          </Badge>
                          <span>·</span>
                          <span>Vence: {dDate.toLocaleDateString("es-CL")}</span>
                          <span
                            className={`font-semibold ${
                              isUrgent ? "text-red-500 animate-pulse" : "text-amber-500"
                            }`}
                          >
                            ({diffDays === 0
                              ? "¡Hoy!"
                              : diffDays === 1
                              ? "¡Mañana!"
                              : diffDays < 0
                              ? "Vencido"
                              : `en ${diffDays} días`})
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-none pt-2.5 sm:pt-0">
                      <span className="font-mono text-base font-bold text-foreground">
                        $
                        {parseFloat(expense.amount).toLocaleString("es-CL", {
                          minimumFractionDigits: 0,
                        })}
                      </span>
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-1.5 shadow-sm"
                        onClick={() => openPayDialog(expense)}
                      >
                        <CreditCard className="size-3.5" />
                        Pagar
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal/Dialog de Confirmación de Pago */}
      <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Asentar Liquidación de Egreso</DialogTitle>
            <DialogDescription>
              Se debitará el monto de forma instantánea de la cuenta física seleccionada.
            </DialogDescription>
          </DialogHeader>

          {selectedExpense && (
            <div className="space-y-4 pt-2">
              {/* Resumen */}
              <div className="py-3 px-4 bg-slate-50 dark:bg-muted/30 border border-slate-200 dark:border-border rounded-xl font-mono text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground text-xs">Proveedor:</span>{" "}
                  <span className="font-semibold text-foreground">
                    {selectedExpense.provider?.name || "Particular"}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground text-xs">Categoría:</span>{" "}
                  {selectedExpense.budget_category}
                </p>
                <p>
                  <span className="text-muted-foreground text-xs">Monto Total:</span>{" "}
                  <span className="font-bold text-red-500">
                    $
                    {parseFloat(selectedExpense.amount).toLocaleString("es-CL", {
                      minimumFractionDigits: 0,
                    })}
                  </span>
                </p>
              </div>

              {/* Selector de cuenta */}
              <div className="space-y-1.5">
                <label htmlFor="pay-account" className="text-xs font-semibold text-muted-foreground">
                  Cuenta Física de Origen *
                </label>
                <select
                  id="pay-account"
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-emerald-600 dark:border-border"
                  value={payAccountId}
                  onChange={(e) => setPayAccountId(e.target.value)}
                >
                  {accounts.length === 0 ? (
                    <option value="">No hay cuentas registradas</option>
                  ) : (
                    accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} (Saldo: ${Number(a.balance).toLocaleString("es-CL")})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPayDialogOpen(false)}
              disabled={submittingPay}
            >
              Abortar
            </Button>
            <Button
              type="button"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              onClick={handleConfirmPayment}
              disabled={submittingPay}
            >
              {submittingPay ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                "Efectuar Pago"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
