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
  const [localError, setLocalError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError(null)

    // Validaciones Locales de Robustez
    const cleanUsername = form.username.trim()
    const cleanFirstName = form.first_name.trim()
    const cleanLastName = form.last_name.trim()

    if (!cleanFirstName || !cleanLastName) {
      setLocalError("El nombre y apellido son obligatorios y no pueden contener solo espacios.")
      return
    }

    const usernameRegex = /^[a-zA-Z0-9_.]+$/
    if (!usernameRegex.test(cleanUsername)) {
      setLocalError("El nombre de usuario solo puede contener letras, números, guiones bajos (_) o puntos (.)")
      return
    }

    if (form.password.length < 6) {
      setLocalError("La contraseña inicial debe tener al menos 6 caracteres.")
      return
    }

    if (form.salary_type === "hourly" && (Number(form.hourly_rate) <= 0 || isNaN(form.hourly_rate))) {
      setLocalError("La tarifa por hora debe ser un número mayor a 0.")
      return
    }

    if (form.salary_type === "fixed" && (Number(form.monthly_salary) <= 0 || isNaN(form.monthly_salary))) {
      setLocalError("El sueldo mensual fijo debe ser un número mayor a 0.")
      return
    }

    setLoading(true)
    try {
      const payload = {
        ...form,
        username: cleanUsername,
        first_name: cleanFirstName,
        last_name: cleanLastName,
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
      const errMsg = err.response?.data?.message || err.response?.data?.errors?.[0]?.message || "Error al registrar el empleado"
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
            {localError && (
              <div className="mt-2 rounded bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive">
                {localError}
              </div>
            )}
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
