import { useState, useEffect } from "react"
import api from "@/api/api"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Key } from "lucide-react"

export default function EditPermissionsModal({ open, onOpenChange, employee, onSuccess, onError }) {
  const [form, setForm] = useState({
    canRegisterClosures: false,
    canRegisterExpenses: false,
    canPayExpenses: false,
    canManageProviders: false,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (employee && employee.employeePermission) {
      setForm({
        canRegisterClosures: !!employee.employeePermission.canRegisterClosures,
        canRegisterExpenses: !!employee.employeePermission.canRegisterExpenses,
        canPayExpenses: !!employee.employeePermission.canPayExpenses,
        canManageProviders: !!employee.employeePermission.canManageProviders,
      })
    }
  }, [employee])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!employee) return
    setLoading(true)
    try {
      await api.put(`/admin/employees/${employee.id}/permissions`, form)
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      onError(err.response?.data?.errors?.[0]?.message || err.response?.data?.message || "Error al actualizar permisos")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="size-5 text-primary" />
              Permisos del Sistema
            </DialogTitle>
            <DialogDescription>
              Habilitá o inhabilitá accesos de {employee?.employeeProfile?.first_name} en tiempo real.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="p-caja">Registrar cierres diarios</Label>
                <p className="text-xs text-muted-foreground">Acceso al módulo de caja diario.</p>
              </div>
              <Switch
                id="p-caja"
                checked={form.canRegisterClosures}
                onCheckedChange={(val) => setForm({ ...form, canRegisterClosures: val })}
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="p-egresos">Registrar nuevos gastos</Label>
                <p className="text-xs text-muted-foreground">Acceso a la carga operativa de gastos.</p>
              </div>
              <Switch
                id="p-egresos"
                checked={form.canRegisterExpenses}
                onCheckedChange={(val) => setForm({ ...form, canRegisterExpenses: val })}
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="p-pagar">Liquidar/Pagar Gastos</Label>
                <p className="text-xs text-muted-foreground">Habilidad de efectivizar egresos (Efectivo/Banco).</p>
              </div>
              <Switch
                id="p-pagar"
                checked={form.canPayExpenses}
                onCheckedChange={(val) => setForm({ ...form, canPayExpenses: val })}
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="p-prov">Gestionar Proveedores</Label>
                <p className="text-xs text-muted-foreground">Permite crear, editar o quitar proveedores.</p>
              </div>
              <Switch
                id="p-prov"
                checked={form.canManageProviders}
                onCheckedChange={(val) => setForm({ ...form, canManageProviders: val })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin mr-2" />}
              Actualizar accesos
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
