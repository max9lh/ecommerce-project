import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Play, AlertCircle, Calendar } from "lucide-react"

export function EmployeeCheckInForm() {
  const { user, employeeCheckIn, attendanceStatus } = useAuth()
  const [time, setTime] = useState(new Date())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Actualizar la hora en tiempo real cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleCheckIn = async () => {
    setLoading(true)
    setError("")
    try {
      await employeeCheckIn()
    } catch (err) {
      setError(err.response?.data?.message || "Ocurrió un error al registrar la entrada.")
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
  }

  const formatDate = (date) => {
    return date.toLocaleDateString("es-AR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <Card className="w-full max-w-md border-primary/20 shadow-xl bg-card/60 backdrop-blur-md">
        <CardHeader className="text-center space-y-2 pb-6 border-b border-border/40">
          <CardTitle className="text-2xl font-bold tracking-tight">Registro de Asistencia</CardTitle>
          <CardDescription className="text-sm">
            ¡Hola, {user?.name || "Empleado"}! Registrá tu horario de entrada para comenzar la jornada laboral.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Reloj y Fecha */}
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-muted/30 border border-border/30 space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
              <Clock className="size-4 text-primary animate-pulse" />
              <span>HORA ACTUAL</span>
            </div>
            <div className="text-4xl font-extrabold tracking-widest text-primary font-mono tabular-nums">
              {formatTime(time)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1 capitalized">
              <Calendar className="size-3.5" />
              <span className="capitalize">{formatDate(time)}</span>
            </div>
          </div>

          {/* Información Adicional */}
          {attendanceStatus?.todaySessionsCount > 0 && (
            <div className="text-xs text-center text-muted-foreground bg-muted/10 p-2 rounded border border-border/20">
              Registraste {attendanceStatus.todaySessionsCount} turno(s) anteriormente hoy.
            </div>
          )}

          {/* Botón de Entrada */}
          <Button
            size="lg"
            className="w-full py-6 text-base font-semibold transition-all duration-300 hover:scale-[1.02] shadow-md shadow-primary/10 flex items-center justify-center gap-2"
            onClick={handleCheckIn}
            disabled={loading}
          >
            <Play className="size-5 fill-current" />
            {loading ? "Registrando..." : "Registrar Entrada (Check-In)"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
