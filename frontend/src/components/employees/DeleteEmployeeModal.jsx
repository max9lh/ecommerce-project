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
import { Loader2, ShieldAlert } from "lucide-react"
import { useState } from "react"

export default function DeleteEmployeeModal({ open, onOpenChange, employee, onSuccess, onError }) {
  const [loading, setLoading] = useState(false)

  const handleDeleteSubmit = async () => {
    if (!employee) return
    setLoading(true)
    try {
      await api.delete(`/admin/employees/${employee.id}`)
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      onError(err.response?.data?.message || "Error al eliminar el empleado")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="size-5" />
            ¿Eliminar Empleado?
          </DialogTitle>
          <DialogDescription>
            ¿Estás seguro que deseas dar de baja a <span className="font-semibold text-foreground">{employee?.employeeProfile?.first_name} {employee?.employeeProfile?.last_name}</span>? 
            Esta acción no se puede deshacer y revocará todo acceso.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleDeleteSubmit} disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin mr-2" />}
            Sí, eliminar definitivamente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
