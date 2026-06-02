import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertTriangle, Clock, CreditCard, Loader2, CheckCircle2 } from "lucide-react"
import api from "@/api/api"

/* ──────────────── Utilidades de formato ──────────────── */

const formatCurrency = (value) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(Number(value))

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })

const getDaysUntil = (dateStr) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`)
  due.setHours(0, 0, 0, 0)
  return Math.round((due - today) / (1000 * 60 * 60 * 24))
}

/* ──────────────── Constantes de urgencia ──────────────── */

const URGENCY = {
  critical: { label: "Hoy", cls: "bg-red-500/15 text-red-500 border-red-500/30" },
  warning:  { label: "Pronto", cls: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  ok:       { label: "Esta semana", cls: "bg-blue-500/15 text-blue-500 border-blue-500/30" },
}

const getUrgency = (days) => {
  if (days <= 1) return "critical"
  if (days <= 3) return "warning"
  return "ok"
}

/* ──────────────── Diálogo de confirmación de pago ──────────────── */

function PayDialog({ expense, accounts, open, onOpenChange, onPaid }) {
  const [selectedAccountId, setSelectedAccountId] = useState("")
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState(null)

  const handlePay = async () => {
    if (!selectedAccountId) return

    setPaying(true)
    setPayError(null)

    try {
      await api.put(`/expenses/${expense.id}/pay`, {
        account_id: parseInt(selectedAccountId),
      })
      onOpenChange(false)
      setSelectedAccountId("")
      onPaid?.()
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Error al procesar el pago"
      setPayError(message)
    } finally {
      setPaying(false)
    }
  }

  const handleClose = (value) => {
    if (!paying) {
      onOpenChange(value)
      setPayError(null)
      setSelectedAccountId("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="size-5 text-primary" />
            Confirmar Pago
          </DialogTitle>
          <DialogDescription>
            Vas a pagar el gasto a <strong>{expense?.provider?.name ?? "—"}</strong> por{" "}
            <strong className="text-foreground">{formatCurrency(expense?.amount ?? 0)}</strong>.
            Seleccioná desde qué cuenta descontarlo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Resumen del gasto */}
          <div className="rounded-lg border bg-muted/50 p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Categoría</span>
              <span className="font-medium">{expense?.budget_category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vencimiento</span>
              <span className="font-medium">{expense?.due_date ? formatDate(expense.due_date) : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monto</span>
              <span className="font-bold">{formatCurrency(expense?.amount ?? 0)}</span>
            </div>
          </div>

          {/* Selector de cuenta */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Cuenta de pago</label>
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cuenta..." />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={String(acc.id)}>
                    {acc.name} — {formatCurrency(acc.balance)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Error de pago */}
          {payError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {payError}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={paying}>
            Cancelar
          </Button>
          <Button
            onClick={handlePay}
            disabled={!selectedAccountId || paying}
            className="gap-2"
          >
            {paying ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Procesando…
              </>
            ) : (
              <>
                <CheckCircle2 className="size-4" />
                Confirmar Pago
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ──────────────── Tabla principal ──────────────── */

export function UpcomingExpensesTable({ expenses = [], accounts = [], onPaid }) {
  const [payingExpense, setPayingExpense] = useState(null)

  if (expenses.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="size-4 text-muted-foreground" />
            Vencimientos Próximos (7 días)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
            <AlertTriangle className="size-8 opacity-30" />
            <p className="text-sm">No hay vencimientos en los próximos 7 días.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="size-4 text-muted-foreground" />
            Vencimientos Próximos (7 días)
            <span className="ml-auto rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-medium text-destructive">
              {expenses.length} pendiente{expenses.length !== 1 ? "s" : ""}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="px-4 py-3 text-left font-medium">Proveedor</th>
                  <th className="hidden sm:table-cell px-4 py-3 text-left font-medium">Categoría</th>
                  <th className="hidden sm:table-cell px-4 py-3 text-left font-medium">Vence</th>
                  <th className="px-4 py-3 text-left font-medium">Urgencia</th>
                  <th className="px-4 py-3 text-right font-medium">Monto</th>
                  <th className="px-4 py-3 text-center font-medium">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {expenses.map((exp) => {
                  const days = getDaysUntil(exp.due_date)
                  const urgencyKey = getUrgency(days)
                  const { cls } = URGENCY[urgencyKey]
                  return (
                    <tr key={exp.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        {exp.provider?.name ?? "—"}
                      </td>
                      <td className="hidden sm:table-cell px-4 py-3 text-muted-foreground">
                        {exp.budget_category}
                      </td>
                      <td className="hidden sm:table-cell px-4 py-3 text-muted-foreground">
                        {formatDate(exp.due_date)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}>
                          {days === 0 ? "Hoy" : days === 1 ? "Mañana" : `${days} días`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {formatCurrency(exp.amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
                          onClick={() => setPayingExpense(exp)}
                        >
                          <CreditCard className="size-3.5" />
                          <span className="hidden sm:inline">Pagar</span>
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Diálogo de pago */}
      {payingExpense && (
        <PayDialog
          expense={payingExpense}
          accounts={accounts}
          open={!!payingExpense}
          onOpenChange={(open) => { if (!open) setPayingExpense(null) }}
          onPaid={onPaid}
        />
      )}
    </>
  )
}
