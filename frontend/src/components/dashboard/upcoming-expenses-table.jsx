import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Clock } from "lucide-react"

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
  })

const getDaysUntil = (dateStr) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dateStr)
  due.setHours(0, 0, 0, 0)
  return Math.round((due - today) / (1000 * 60 * 60 * 24))
}

const URGENCY = {
  critical: { label: "Hoy", cls: "bg-red-500/15 text-red-500 border-red-500/30" },
  warning:  { label: "Pronto", cls: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  ok:       { label: "Esta semana", cls: "bg-blue-500/15 text-blue-500 border-blue-500/30" },
}

function getUrgency(days) {
  if (days <= 1) return "critical"
  if (days <= 3) return "warning"
  return "ok"
}

export function UpcomingExpensesTable({ expenses = [] }) {
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
                <th className="px-4 py-3 text-left font-medium">Categoría</th>
                <th className="px-4 py-3 text-left font-medium">Vence</th>
                <th className="px-4 py-3 text-left font-medium">Urgencia</th>
                <th className="px-4 py-3 text-right font-medium">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {expenses.map((exp) => {
                const days = getDaysUntil(exp.due_date)
                const urgencyKey = getUrgency(days)
                const { label, cls } = URGENCY[urgencyKey]
                return (
                  <tr key={exp.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      {exp.provider?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {exp.budget_category}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
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
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
