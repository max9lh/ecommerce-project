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
import { Loader2, Briefcase } from "lucide-react"

export default function EditProfileModal({ open, onOpenChange, employee, onSuccess, onError }) {
  const [form, setForm] = useState({
    salary_type: "hourly",
    hourly_rate: 0,
    monthly_salary: 0,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (employee && employee.employeeProfile) {
      setForm({
        salary_type: employee.employeeProfile.salary_type || "hourly",
        hourly_rate: Number(employee.employeeProfile.hourly_rate) || 0,
        monthly_salary: Number(employee.employeeProfile.monthly_salary) || 0,
      })
    }
  }, [employee])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!employee) return
    setLoading(true)
    try {
      const payload = {
        salary_type: form.salary_type,
        hourly_rate: Number(form.hourly_rate),
        monthly_salary: form.salary_type === "fixed" ? Number(form.monthly_salary) : null,
      }
      await api.put(`/admin/employees/${employee.id}/profile`, payload)
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      onError(err.response?.data?.message || err.response?.data?.errors?.[0]?.message || "Error al actualizar perfil")
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
              <Briefcase className="size-5 text-primary" />
              Actualizar Remuneración
            </DialogTitle>
            <DialogDescription>
              Modificá las condiciones contractuales de {employee?.employeeProfile?.first_name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="e-salary-type">Tipo de Contrato</Label>
              <select
                id="e-salary-type"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none"
                value={form.salary_type}
                onChange={(e) => setForm({ ...form, salary_type: e.target.value })}
              >
                <option value="hourly">Por hora</option>
                <option value="fixed">Sueldo Fijo Mensual</option>
              </select>
            </div>

            {form.salary_type === "hourly" ? (
              <div className="space-y-2">
                <Label htmlFor="e-hourly-rate">Tarifa por hora ($)</Label>
                <Input
                  id="e-hourly-rate"
                  type="number"
                  min="0"
                  required
                  value={form.hourly_rate}
                  onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="e-monthly-salary">Sueldo Fijo Mensual ($)</Label>
                <Input
                  id="e-monthly-salary"
                  type="number"
                  min="0"
                  required
                  value={form.monthly_salary}
                  onChange={(e) => setForm({ ...form, monthly_salary: e.target.value })}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin mr-2" />}
              Guardar cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
