import api from "@/api/api"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Trash2 } from "lucide-react"
import { useState } from "react"

export default function DeleteAttendanceModal({ open, onOpenChange, log, onSuccess, onError }) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!log) return
    setLoading(true)
    try {
      await api.delete(`/attendance/${log.id}`)
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      onError(err.response?.data?.message || "Error al eliminar el turno")
    } finally {
      setLoading(false)
    }
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return ""
    return new Date(dateString).toLocaleString("es-AR", {
      dateStyle: "short",
      timeStyle: "short",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="size-5" />
            ¿Eliminar Turno?
          </DialogTitle>
          <DialogDescription>
            ¿Estás seguro que deseas eliminar el turno registrado para{" "}
            <span className="font-semibold text-foreground">{log?.employee?.name}</span>?
            <br />
            <span className="text-xs text-muted-foreground block mt-2 font-mono">
              Entrada: {formatDateTime(log?.check_in)}
              <br />
              Salida: {formatDateTime(log?.check_out)}
            </span>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin mr-2" />}
            Confirmar Baja
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
