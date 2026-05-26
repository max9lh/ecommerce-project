import { useState } from "react"
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
import { Loader2, UserCog } from "lucide-react"

export default function CreateEmployeeModal({ open, onOpenChange, onSuccess, onError }) {
  const [form, setForm] = useState({
    username: "",
    password: "",
    first_name: "",
    last_name: "",
    salary_type: "hourly",
    hourly_rate: 0,
    monthly_salary: 0,
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...form,
        hourly_rate: Number(form.hourly_rate),
        monthly_salary: form.salary_type === "fixed" ? Number(form.monthly_salary) : null,
      }
      await api.post("/admin/employees", payload)
      setForm({
        username: "",
        password: "",
        first_name: "",
        last_name: "",
        salary_type: "hourly",
        hourly_rate: 0,
        monthly_salary: 0,
      })
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      onError(err.response?.data?.message || err.response?.data?.errors?.[0]?.message || "Error al registrar el empleado")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="size-5 text-primary" />
              Registrar Nuevo Empleado
            </DialogTitle>
            <DialogDescription>
              Crea un nuevo usuario del tipo personal y configura su salario inicial.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="c-first-name">Nombre</Label>
                <Input
                  id="c-first-name"
                  required
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-last-name">Apellido</Label>
                <Input
                  id="c-last-name"
                  required
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="c-username">Nombre de Usuario</Label>
              <Input
                id="c-username"
                required
                placeholder="ej: juanperez"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="c-password">Contraseña inicial</Label>
              <Input
                id="c-password"
                type="password"
                required
                placeholder="Min 8 caracteres"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="c-salary-type">Tipo de Contrato</Label>
              <select
                id="c-salary-type"
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
                <Label htmlFor="c-hourly-rate">Tarifa por hora ($)</Label>
                <Input
                  id="c-hourly-rate"
                  type="number"
                  min="0"
                  required
                  value={form.hourly_rate || ""}
                  onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="c-monthly-salary">Sueldo Fijo Mensual ($)</Label>
                <Input
                  id="c-monthly-salary"
                  type="number"
                  min="0"
                  required
                  value={form.monthly_salary || ""}
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
              Registrar Empleado
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
