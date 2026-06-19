import { useState, useEffect } from "react"
import api from "@/api/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Loader2,
  Calendar,
  Clock,
  Briefcase,
  DollarSign,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Trash2,
  Edit,
  SlidersHorizontal,
} from "lucide-react"

// Modales Modularizados
import EditAttendanceModal from "@/components/attendance/EditAttendanceModal"
import DeleteAttendanceModal from "@/components/attendance/DeleteAttendanceModal"
import LiquidateModal from "@/components/attendance/LiquidateModal"

export default function AttendanceAdmin() {
  const [activeTab, setActiveTab] = useState("turnos") // "turnos" | "liquidaciones"
  const [employees, setEmployees] = useState([])
  const [attendanceLogs, setAttendanceLogs] = useState([])
  const [summaries, setSummaries] = useState([])

  // Loadings
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Mensajes de Alerta/Éxito
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // --- Filtros Pestaña 1 (Turnos) ---
  const [filterEmployeeId, setFilterEmployeeId] = useState("")
  const [filterFrom, setFilterFrom] = useState("")
  const [filterTo, setFilterTo] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  // --- Form Carga Turno ---
  const [createForm, setCreateForm] = useState({
    employeeId: "",
    checkIn: "",
    checkOut: "",
  })

  // --- Filtros Pestaña 2 (Liquidaciones) ---
  // Rango de fechas por defecto: desde inicio de mes hasta hoy
  const getFirstOfMonth = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`
  }
  const getTodayDate = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  }
  const [liqFrom, setLiqFrom] = useState(getFirstOfMonth())
  const [liqTo, setLiqTo] = useState(getTodayDate())
  const [liqEmployeeId, setLiqEmployeeId] = useState("")

  // --- Modales States ---
  const [selectedLog, setSelectedLog] = useState(null)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const [selectedSummary, setSelectedSummary] = useState(null)
  const [liquidateOpen, setLiquidateOpen] = useState(false)

  // Fetch inicial de empleados
  const fetchEmployees = async () => {
    setLoadingEmployees(true)
    try {
      const res = await api.get("/admin/employees")
      const list = res.data.data ?? []
      setEmployees(list)
      if (list.length > 0) {
        setCreateForm((prev) => ({ ...prev, employeeId: String(list[0].id) }))
      }
    } catch (err) {
      console.error(err)
      setError("Error al cargar listado de empleados")
    } finally {
      setLoadingEmployees(false)
    }
  }

  // Fetch de turnos registrados
  const fetchAttendanceLogs = async () => {
    setLoadingLogs(true)
    setError(null)
    try {
      const params = {}
      if (filterEmployeeId) params.employeeId = filterEmployeeId
      
      if (filterFrom) {
        const fromMs = Date.parse(filterFrom)
        if (!isNaN(fromMs)) params.from = new Date(fromMs).toISOString()
      }
      if (filterTo) {
        const toMs = Date.parse(filterTo)
        if (!isNaN(toMs)) params.to = new Date(toMs).toISOString()
      }

      const res = await api.get("/attendance", { params })
      setAttendanceLogs(res.data.data ?? [])
    } catch (err) {
      console.error(err)
      setError("Error al cargar historial de turnos")
    } finally {
      setLoadingLogs(false)
    }
  }

  // Fetch de Resumen de Liquidación
  const fetchSettlementSummary = async () => {
    if (!liqFrom || !liqTo) {
      setError("Por favor, selecciona un rango de fechas para liquidar.")
      return
    }
    
    const fromMs = Date.parse(liqFrom)
    const toMs = Date.parse(liqTo)

    if (isNaN(fromMs) || isNaN(toMs)) {
      setError("Por favor, selecciona un rango de fechas válido para liquidar.")
      return
    }

    setLoadingSummary(true)
    setError(null)
    try {
      const params = {
        from: new Date(fromMs).toISOString(),
        to: new Date(toMs).toISOString(),
      }
      if (liqEmployeeId) params.employeeId = liqEmployeeId

      const res = await api.get("/attendance/summary", { params })
      setSummaries(res.data.data ?? [])
    } catch (err) {
      console.error(err)
      setError("Error al generar resumen de liquidación")
    } finally {
      setLoadingSummary(false)
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

  useEffect(() => {
    if (activeTab === "turnos") {
      fetchAttendanceLogs()
    } else {
      fetchSettlementSummary()
    }
  }, [activeTab, filterEmployeeId, filterFrom, filterTo])

  // Carga manual de turno
  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!createForm.employeeId || !createForm.checkIn || !createForm.checkOut) {
      setError("Todos los campos de carga de turno son obligatorios.")
      return
    }

    const checkInMs = Date.parse(createForm.checkIn)
    const checkOutMs = Date.parse(createForm.checkOut)

    if (isNaN(checkInMs) || isNaN(checkOutMs)) {
      setError("Las fechas ingresadas para el turno no son válidas.")
      return
    }

    if (checkOutMs <= checkInMs) {
      setError("La fecha y hora de salida (check-out) debe ser posterior a la de entrada (check-in).")
      return
    }

    setActionLoading(true)
    try {
      await api.post("/attendance", {
        employeeId: Number(createForm.employeeId),
        checkIn: new Date(checkInMs).toISOString(),
        checkOut: new Date(checkOutMs).toISOString(),
      })
      setSuccess("Turno cargado manualmente con éxito.")
      setCreateForm({
        ...createForm,
        checkIn: "",
        checkOut: "",
      })
      await fetchAttendanceLogs()
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.message || "Error al registrar asistencia")
    } finally {
      setActionLoading(false)
    }
  }

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString("es-AR", {
      dateStyle: "short",
      timeStyle: "short",
    })
  }

  const formatMoney = (val) => {
    return Number(val).toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Control de Asistencia</h1>
          <p className="text-sm text-muted-foreground">
            Cargá turnos de trabajo y procesá la liquidación de sueldos para el personal.
          </p>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2">
          <ShieldAlert className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-500 flex items-center gap-2">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="flex border-b border-muted gap-1">
        <button
          onClick={() => {
            setActiveTab("turnos")
            setError(null)
            setSuccess(null)
          }}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "turnos"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Clock className="size-4" />
          Historial y Carga de Turnos
        </button>
        <button
          onClick={() => {
            setActiveTab("liquidaciones")
            setError(null)
            setSuccess(null)
          }}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "liquidaciones"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <DollarSign className="size-4" />
          Liquidación de Sueldos
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. SOLAPA: GESTIÓN DE TURNOS */}
      {/* ========================================================================= */}
      {activeTab === "turnos" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 h-fit">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="size-4 text-primary" />
                Carga de Turno Manual
              </CardTitle>
              <CardDescription>
                Registrá entrada y salida para calcular horas trabajadas de forma directa.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="c-employee">Empleado</Label>
                  <select
                    id="c-employee"
                    required
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none"
                    value={createForm.employeeId}
                    onChange={(e) => setCreateForm({ ...createForm, employeeId: e.target.value })}
                  >
                    {loadingEmployees ? (
                      <option>Cargando empleados...</option>
                    ) : employees.length === 0 ? (
                      <option>No hay empleados cargados</option>
                    ) : (
                      employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.employeeProfile?.first_name} {emp.employeeProfile?.last_name} (@{emp.username})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="c-checkin">Fecha/Hora de Entrada</Label>
                  <Input
                    id="c-checkin"
                    type="datetime-local"
                    required
                    value={createForm.checkIn}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, checkIn: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="c-checkout">Fecha/Hora de Salida</Label>
                  <Input
                    id="c-checkout"
                    type="datetime-local"
                    required
                    value={createForm.checkOut}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, checkOut: e.target.value }))}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={actionLoading || employees.length === 0}>
                  {actionLoading && <Loader2 className="size-4 animate-spin mr-2" />}
                  Registrar Turno
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Tabla de registros */}
          <div className="lg:col-span-2 space-y-4">
            {/* Listado */}
            <Card>
              <CardHeader className="py-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base flex items-center gap-1.5">
                      <Clock className="size-4 text-primary" />
                      Listado de Turnos
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {attendanceLogs.length} turnos encontrados
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="gap-1.5 h-8 text-xs font-semibold px-2.5 border-dashed"
                  >
                    <SlidersHorizontal className="size-3.5" />
                    {showFilters ? "Ocultar Filtros" : "Filtrar"}
                    {(filterEmployeeId || filterFrom || filterTo) && (
                      <span className="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    )}
                  </Button>
                </div>
              </CardHeader>

              {/* Filtros de historial (integrado dentro de la tarjeta) */}
              {showFilters && (
                <div className="border-t border-b border-muted/50 bg-slate-50/30 dark:bg-slate-900/5 px-6 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-1.5 duration-200">
                  <div className="space-y-1.5">
                    <Label htmlFor="f-employee" className="text-xs font-semibold">Filtrar Empleado</Label>
                    <select
                      id="f-employee"
                      className="w-full rounded-md border bg-background px-3 py-1.5 text-xs focus:outline-none"
                      value={filterEmployeeId}
                      onChange={(e) => setFilterEmployeeId(e.target.value)}
                    >
                      <option value="">Todos los empleados</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.employeeProfile?.first_name} {emp.employeeProfile?.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="f-from" className="text-xs font-semibold">Desde</Label>
                    <Input
                      id="f-from"
                      type="date"
                      className="h-8 text-xs"
                      value={filterFrom}
                      onChange={(e) => setFilterFrom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="f-to" className="text-xs font-semibold">Hasta</Label>
                    <Input
                      id="f-to"
                      type="date"
                      className="h-8 text-xs"
                      value={filterTo}
                      onChange={(e) => setFilterTo(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <CardContent className="p-0 sm:px-6 pb-6 pt-4">
                {loadingLogs ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="size-8 animate-spin text-muted-foreground" />
                  </div>
                ) : attendanceLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="flex size-12 items-center justify-center rounded-full bg-muted mb-3">
                      <Clock className="size-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">No se encontraron turnos en este período</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Empleado</TableHead>
                        <TableHead>Horarios</TableHead>
                        <TableHead>Duración</TableHead>
                        <TableHead>Ganado</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceLogs.map((log) => {
                        const isLiquidated = !!log.notes
                        const isActiveShift = !log.check_out
                        return (
                          <TableRow key={log.id}>
                            <TableCell className="font-medium">
                              {log.employee?.name || "Cargando..."}
                            </TableCell>
                            <TableCell>
                              <div className="text-xs space-y-0.5">
                                <p><span className="text-muted-foreground">Entrada:</span> {formatDateTime(log.check_in)}</p>
                                <p>
                                  <span className="text-muted-foreground">Salida:</span>{" "}
                                  {isActiveShift ? (
                                    <span className="inline-flex items-center gap-1 text-blue-500 font-semibold">
                                      <span className="size-1.5 rounded-full bg-blue-500 animate-pulse" />
                                      En turno
                                    </span>
                                  ) : (
                                    formatDateTime(log.check_out)
                                  )}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold text-sm">
                              {isActiveShift ? (
                                <span className="text-muted-foreground">-</span>
                              ) : (
                                `${log.hours_worked} hs`
                              )}
                            </TableCell>
                            <TableCell className="font-semibold text-sm">
                              {isActiveShift ? (
                                <span className="text-muted-foreground">-</span>
                              ) : Number(log.amount_earned) > 0 ? (
                                <span className="text-emerald-500">${formatMoney(log.amount_earned)}</span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {isActiveShift ? (
                                <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-500 flex items-center gap-1 w-fit">
                                  <Clock className="size-3" />
                                  En turno
                                </span>
                              ) : isLiquidated ? (
                                <span
                                  className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-500 flex items-center gap-1 w-fit"
                                  title={log.notes}
                                >
                                  <CheckCircle2 className="size-3" />
                                  Liquidado
                                </span>
                              ) : (
                                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-500 flex items-center gap-1 w-fit">
                                  <AlertCircle className="size-3" />
                                  Pendiente
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8"
                                  disabled={isLiquidated}
                                  onClick={() => {
                                    setSelectedLog(log)
                                    setEditOpen(true)
                                  }}
                                >
                                  <Edit className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-destructive hover:bg-destructive/10"
                                  disabled={isLiquidated}
                                  onClick={() => {
                                    setSelectedLog(log)
                                    setDeleteOpen(true)
                                  }}
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SOLAPA: LIQUIDACIÓN DE SUELDOS */}
      {/* ========================================================================= */}
      {activeTab === "liquidaciones" && (
        <div className="space-y-6">
          {/* Rango de búsqueda */}
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="size-4 text-primary" />
                Definir Período de Liquidación
              </CardTitle>
              <CardDescription>
                Seleccioná las fechas de inicio y fin para calcular el devengamiento de horas no liquidadas de tu personal.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
              <div className="space-y-1.5">
                <Label htmlFor="l-from" className="text-xs">Desde</Label>
                <Input
                  id="l-from"
                  type="date"
                  value={liqFrom}
                  onChange={(e) => setLiqFrom(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="l-to" className="text-xs">Hasta</Label>
                <Input
                  id="l-to"
                  type="date"
                  value={liqTo}
                  onChange={(e) => setLiqTo(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="l-emp" className="text-xs">Empleado (Opcional)</Label>
                <select
                  id="l-emp"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none h-10"
                  value={liqEmployeeId}
                  onChange={(e) => setLiqEmployeeId(e.target.value)}
                >
                  <option value="">Todos</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.employeeProfile?.first_name} {emp.employeeProfile?.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <Button onClick={fetchSettlementSummary} className="h-10 gap-2">
                <Search className="size-4" />
                Buscar Horas
              </Button>
            </CardContent>
          </Card>

          {/* Resultados de la búsqueda */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumen de Liquidación Pendiente</CardTitle>
              <CardDescription>
                Detalle consolidado de montos devengados por empleado en el período seleccionado.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:px-6 pb-6">
              {loadingSummary ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="size-8 animate-spin text-muted-foreground" />
                </div>
              ) : summaries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex size-14 items-center justify-center rounded-full bg-muted mb-4">
                    <Briefcase className="size-7 text-muted-foreground" />
                  </div>
                  <h3 className="text-sm font-semibold">No hay horas pendientes para liquidar</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mt-1">
                    Todos los turnos de este período ya fueron liquidados en egresos o no existen registros cargados.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empleado</TableHead>
                      <TableHead>Tipo de Contrato</TableHead>
                      <TableHead>Total Horas</TableHead>
                      <TableHead>Monto Acumulado</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summaries.map((item) => (
                      <TableRow key={item.employeeId}>
                        <TableCell className="font-semibold">{item.name}</TableCell>
                        <TableCell className="capitalize text-sm font-medium">
                          {item.salaryType === "hourly" ? "Por Hora" : "Sueldo Fijo"}
                        </TableCell>
                        <TableCell className="font-semibold text-sm">
                          {item.salaryType === "hourly" ? `${item.totalHours} hs` : "-"}
                        </TableCell>
                        <TableCell className="font-bold text-sm text-emerald-500">
                          ${formatMoney(item.calculatedAmount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
                            onClick={() => {
                              setSelectedSummary(item)
                              setLiquidateOpen(true)
                            }}
                          >
                            <DollarSign className="size-3.5 mr-1" />
                            Liquidar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALES DE CONTROL */}
      {/* ========================================================================= */}
      <EditAttendanceModal
        open={editOpen}
        onOpenChange={setEditOpen}
        log={selectedLog}
        onSuccess={fetchAttendanceLogs}
        onError={setError}
      />

      <DeleteAttendanceModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        log={selectedLog}
        onSuccess={fetchAttendanceLogs}
        onError={setError}
      />

      <LiquidateModal
        open={liquidateOpen}
        onOpenChange={setLiquidateOpen}
        summaryItem={selectedSummary}
        from={liqFrom}
        to={liqTo}
        onSuccess={(msg) => {
          setSuccess(msg)
          fetchSettlementSummary()
        }}
        onError={setError}
      />
    </div>
  )
}
