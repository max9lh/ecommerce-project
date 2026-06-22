import { useState, useEffect } from "react"
import api from "@/api/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  ShieldAlert,
  Search,
  RefreshCw,
  Clock,
  User,
  Activity,
  Info
} from "lucide-react"

export default function AuditLogs() {
  const [logs, setLogs] = useState([])
  const [filteredLogs, setFilteredLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAction, setSelectedAction] = useState("")

  // Paginación
  const [page, setPage] = useState(1)
  const [limit] = useState(12) // Mostrar 12 registros por página
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get("/admin/audit-logs", {
        params: { page, limit }
      })
      const logsData = res.data.data ?? []
      const meta = res.data.meta ?? { total: logsData.length, page: 1, limit: 12, totalPages: 1 }

      setLogs(logsData)
      setFilteredLogs(logsData)
      setTotalPages(meta.totalPages)
      setTotal(meta.total)
    } catch (err) {
      setError(err.response?.data?.message || "Error al cargar el registro de auditoría")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [page])

  // Reiniciar página cuando cambian los filtros
  useEffect(() => {
    setPage(1)
  }, [searchTerm, selectedAction])

  useEffect(() => {
    let result = logs

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (log) =>
          log.user.username.toLowerCase().includes(term) ||
          log.details.toLowerCase().includes(term) ||
          log.action.toLowerCase().includes(term)
      )
    }

    if (selectedAction) {
      result = result.filter((log) => log.action === selectedAction)
    }

    setFilteredLogs(result)
  }, [searchTerm, selectedAction, logs])

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const formatTime = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  // Get list of unique actions for filter
  const actionsList = Array.from(new Set(logs.map((log) => log.action)))

  const getActionStyles = (action) => {
    switch (action) {
      case "REGISTRAR_CIERRE":
        return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
      case "CREAR_PROVEEDOR":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
      case "MODIFICAR_PROVEEDOR":
        return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
      case "ELIMINAR_PROVEEDOR":
        return "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
      case "REGISTRAR_EGRESO":
        return "bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800"
      case "PAGAR_EGRESO":
        return "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800"
      case "ELIMINAR_EGRESO":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  const getActionLabel = (action) => {
    return action.replace(/_/g, " ")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Auditoría del Sistema</h1>
          <p className="text-sm text-muted-foreground">
            Monitoreá y auditá todas las acciones realizadas por los empleados.
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2 w-full sm:w-auto justify-center"
          onClick={fetchLogs}
          disabled={loading}
        >
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2">
          <ShieldAlert className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative col-span-1 sm:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por usuario, acción o detalle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div>
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:bg-background text-foreground"
          >
            <option value="" className="text-foreground dark:bg-zinc-950">Todas las acciones</option>
            {actionsList.map((action) => (
              <option key={action} value={action} className="text-foreground dark:bg-zinc-950">
                {getActionLabel(action)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted mb-4">
              <Activity className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Sin registros encontrados</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              No hay acciones registradas en la auditoría que coincidan con los filtros seleccionados.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-primary shrink-0">
                <ShieldAlert className="size-5" />
              </div>
              <div>
                <CardTitle className="text-base">Historial de Operaciones</CardTitle>
                <CardDescription>
                  Se muestran {filteredLogs.length} registro{filteredLogs.length !== 1 ? "s" : ""} de auditoría.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[115px]">Fecha</TableHead>
                    <TableHead className="w-[90px]">Hora</TableHead>
                    <TableHead className="w-[150px]">Usuario</TableHead>
                    <TableHead className="w-[180px] text-center">Acción</TableHead>
                    <TableHead>Detalles</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-sm">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="size-3.5" />
                          {formatDate(log.created_at)}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {formatTime(log.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs">
                            <User className="size-3" />
                          </div>
                          <div>
                            <div className="font-medium text-sm text-foreground">{log.user.username}</div>
                            <div className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold">
                              {log.user.role}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${getActionStyles(
                            log.action
                          )}`}
                        >
                          {getActionLabel(log.action)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-foreground">
                        <div className="flex items-start gap-1.5">
                          <Info className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                          <span>{log.details}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Controles de Paginación */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground font-medium">
                  Mostrando <span className="font-semibold text-foreground">{((page - 1) * limit) + 1}</span> a{" "}
                  <span className="font-semibold text-foreground">{Math.min(page * limit, total)}</span> de{" "}
                  <span className="font-semibold text-foreground">{total}</span> registros de auditoría
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Anterior
                  </Button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                    const isCurrent = p === page;
                    // Mostrar solo primera, última, actual y adyacentes
                    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) {
                      return (
                        <Button
                          key={p}
                          variant={isCurrent ? "default" : "outline"}
                          size="sm"
                          className={`size-9 p-0 ${isCurrent ? 'bg-primary text-primary-foreground font-bold' : ''}`}
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </Button>
                      );
                    }
                    if (p === 2 || p === totalPages - 1) {
                      return <span key={p} className="text-muted-foreground px-1">...</span>;
                    }
                    return null;
                  })}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
