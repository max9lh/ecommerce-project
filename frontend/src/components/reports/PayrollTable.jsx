import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Users, Clock, DollarSign } from "lucide-react"

const formatCurrency = (value) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(value)

export function PayrollTable({ data, loading }) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="h-5 w-44 rounded bg-muted animate-pulse" />
          <div className="h-4 w-56 rounded bg-muted animate-pulse mt-1" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 rounded bg-muted/50 animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const { employees, grandTotal, totalHours } = data
  const hasData = employees && employees.length > 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" />
              Nómina del Período
            </CardTitle>
            <CardDescription className="mt-0.5">
              Desglose de costo laboral por empleado
            </CardDescription>
          </div>
          {hasData && (
            <div className="flex items-center gap-5">
              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Clock className="size-3" /> Horas
                </p>
                <p className="text-base font-bold font-mono">{totalHours}h</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <DollarSign className="size-3" /> Total
                </p>
                <p className="text-base font-bold font-mono text-rose-500">
                  {formatCurrency(grandTotal)}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {!hasData ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Sin registros de asistencia en este período.
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="font-semibold">Empleado</TableHead>
                  <TableHead className="text-center font-semibold">Tipo</TableHead>
                  <TableHead className="text-center font-semibold">Turnos</TableHead>
                  <TableHead className="text-right font-semibold">Horas</TableHead>
                  <TableHead className="text-right font-semibold">Tarifa/h</TableHead>
                  <TableHead className="text-right font-semibold">Total a Pagar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow key={emp.employeeId} className="hover:bg-accent/40 transition-colors">
                    <TableCell className="font-medium">{emp.name}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={`text-xs font-semibold ${
                          emp.salaryType === "hourly"
                            ? "border-blue-500/40 text-blue-600 dark:text-blue-400 bg-blue-500/8"
                            : "border-purple-500/40 text-purple-600 dark:text-purple-400 bg-purple-500/8"
                        }`}
                      >
                        {emp.salaryType === "hourly" ? "Por hora" : "Fijo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-mono text-sm">
                      {emp.shifts}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {emp.totalHours}h
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-muted-foreground">
                      {emp.hourlyRate !== null ? formatCurrency(emp.hourlyRate) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {formatCurrency(emp.totalToPay)}
                    </TableCell>
                  </TableRow>
                ))}
                {/* Row de totales */}
                <TableRow className="bg-muted/20 border-t-2 hover:bg-muted/30">
                  <TableCell colSpan={2} className="font-bold text-sm">
                    TOTAL NÓMINA
                  </TableCell>
                  <TableCell className="text-center font-mono font-bold text-sm">
                    {employees.reduce((s, e) => s + e.shifts, 0)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-sm">
                    {totalHours}h
                  </TableCell>
                  <TableCell />
                  <TableCell className="text-right font-mono font-bold text-base text-rose-500">
                    {formatCurrency(grandTotal)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
