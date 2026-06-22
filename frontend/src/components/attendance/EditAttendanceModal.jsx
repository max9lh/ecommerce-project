import { useState, useEffect } from "react"
import api from "@/api/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Calendar } from "lucide-react"

export default function EditAttendanceModal({ open, onOpenChange, log, onSuccess, onError }) {
  const [checkIn, setCheckIn] = useState("")
  const [checkOut, setCheckOut] = useState("")
  const [loading, setLoading] = useState(false)
  const [localError, setLocalError] = useState(null)

  useEffect(() => {
    if (log) {
      // Formatear fechas a formato YYYY-MM-DDTHH:MM para inputs datetime-local
      const formatToDateTimeLocal = (dateString) => {
        const d = new Date(dateString)
        const pad = (n) => String(n).padStart(2, "0")
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
      }
      setCheckIn(formatToDateTimeLocal(log.check_in))
      setCheckOut(formatToDateTimeLocal(log.check_out))
    }
    setLocalError(null)
  }, [log])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!log) return
    setLocalError(null)

    const checkInMs = Date.parse(checkIn)
    const checkOutMs = Date.parse(checkOut)

    if (isNaN(checkInMs) || isNaN(checkOutMs)) {
      setLocalError("Las fechas ingresadas para el turno no son válidas.")
      return
    }

    if (checkOutMs <= checkInMs) {
      setLocalError("La fecha de salida (check-out) debe ser posterior a la de entrada (check-in).")
      return
    }

    setLoading(true)
    try {
      await api.put(`/attendance/${log.id}`, {
        checkIn: new Date(checkInMs).toISOString(),
        checkOut: new Date(checkOutMs).toISOString(),
      })
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      const errMsg = err.response?.data?.errors?.[0]?.message || err.response?.data?.message || "Error al actualizar el turno"
      setLocalError(errMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) setLocalError(null)
      onOpenChange(val)
    }}>
      <DialogContent className="max-w-sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="size-5 text-primary" />
              Editar Turno
            </DialogTitle>
            <DialogDescription>
              Modificá las horas registradas para {log?.employee?.name || "el empleado"}.
            </DialogDescription>
            {localError && (
              <div className="mt-2 rounded bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive">
                {localError}
              </div>
            )}
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="e-checkin">Entrada</Label>
              <Input
                id="e-checkin"
                type="datetime-local"
                required
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-checkout">Salida</Label>
              <Input
                id="e-checkout"
                type="datetime-local"
                required
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin mr-2" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
