import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "@/api/api"
import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ClipboardList,
  Loader2,
  PlusCircle,
  Wallet,
  Landmark,
  Banknote,
  Pencil,
} from "lucide-react"

export default function ClosuresList() {


  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [closures, setClosures] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchClosures = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await api.get("/closures")
        setClosures(res.data.data ?? [])
      } catch (err) {
        setError(err.response?.data?.message || "Error al cargar los cierres de caja")
      } finally {
        setLoading(false)
      }
    }

    fetchClosures()
  }, [])

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
    })
  }

  const formatMoney = (value) => {
    return Number(value).toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  // Ícono según nombre de cuenta
  const getAccountIcon = (name) => {
    const lower = name.toLowerCase()
    if (lower.includes("efectivo") || lower.includes("caja")) return Wallet
    if (lower.includes("banco") || lower.includes("bancaria")) return Landmark
    return Banknote
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cierres de Caja</h1>
          <p className="text-sm text-muted-foreground">
            Historial de todos los cierres diarios registrados.
          </p>
        </div>
        <Button
          className="gap-2 w-full sm:w-auto justify-center"
          onClick={() => navigate("/cierres/nuevo")}
        >
          <PlusCircle className="size-4" />
          Nuevo Cierre
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Tabla */}
      {!loading && closures.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted mb-4">
              <ClipboardList className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Sin cierres registrados</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              Todavía no se registró ningún cierre de caja. Hacé clic en "Nuevo Cierre" para registrar el primero.
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && closures.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-primary shrink-0">
                <ClipboardList className="size-5" />
              </div>
              <div>
                <CardTitle className="text-base">Registro de Cierres</CardTitle>
                <CardDescription>
                  {closures.length} cierre{closures.length !== 1 ? "s" : ""} registrado{closures.length !== 1 ? "s" : ""}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">#</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Registrado por</TableHead>
                  <TableHead>Desglose</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  {isAdmin && <TableHead className="text-center w-[100px]">Acción</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {closures.map((closure) => (
                  <TableRow key={closure.id}>
                    <TableCell className="font-mono text-muted-foreground">
                      {closure.id}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatDate(closure.date)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatTime(closure.date)}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {closure.user.username}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {closure.details.map((detail, idx) => {
                          return (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs"
                            >
                              {detail.account.name}: ${formatMoney(detail.amount)}
                            </span>
                          )
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      ${formatMoney(closure.total_amount)}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => navigate(`/cierres/editar/${closure.id}`)}
                          title="Editar Cierre de Caja"
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
