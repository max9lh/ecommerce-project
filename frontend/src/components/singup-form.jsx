import * as React from "react"
import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import api from "@/api/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function SignupForm({ className, ...props }) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    pct_merchandise: 60,
    pct_fixed_expenses: 30,
    pct_savings: 10,
  })
  
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const manejarSubmit = async (evento) => {
    evento.preventDefault()
    setError("")
    setSuccess(false)

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden.")
      return
    }

    const total = Number(formData.pct_merchandise) + Number(formData.pct_fixed_expenses) + Number(formData.pct_savings)
    if (total !== 100) {
      setError(`Los porcentajes deben sumar 100%. Actualmente suman ${total}%.`)
      return
    }

    try {
      await api.post("/auth/register", {
        username: formData.username,
        password: formData.password,
        pct_merchandise: Number(formData.pct_merchandise) / 100,
        pct_fixed_expenses: Number(formData.pct_fixed_expenses) / 100,
        pct_savings: Number(formData.pct_savings) / 100,
      })
      
      setSuccess(true)
      setTimeout(() => navigate("/login"), 2000)
    } catch (err) {
      console.error("Error completo en el registro:", err);
      console.log("Respuesta del servidor (si existe):", err.response);

      if (err.response?.data?.errors) {
        setError(err.response.data.errors[0].message);
      } else {
        const mensajeError = err.response?.data?.message || err.message || "Error al registrar el usuario";
        setError(mensajeError);
      }
    }
  }

  return (
    <form onSubmit={manejarSubmit} className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col gap-4">
        
        <div className="flex flex-col items-center gap-1 text-center mb-2">
          <h1 className="text-2xl font-bold">Crea tu Cuenta</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Registrate en Gestor Financiero y configurá tus reglas de distribución de presupuesto. 
          </p>
        </div>

        {error && (
          <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md border border-destructive/20 font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 text-sm bg-green-500/10 text-green-600 rounded-md border border-green-500/20 font-medium">
            ¡Registro exitoso! Redirigiendo al login...
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="username">Nombre de Usuario</Label>
          <Input id="username" type="text" placeholder="Diego Armando" required minLength={6} maxLength={20} value={formData.username} onChange={handleChange}  />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" required minLength={8} value={formData.password} onChange={handleChange}/>
          <p className="text-xs text-muted-foreground">Must be at least 8 characters long.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input id="confirmPassword" type="password" required minLength={8} value={formData.confirmPassword} onChange={handleChange} />
          <p className="text-xs text-muted-foreground">Please confirm your password.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pct_merchandise">Mercadería (%)</Label>
          <Input id="pct_merchandise" type="number" min="0" max="100" required value={formData.pct_merchandise} onChange={handleChange} />
          <p className="text-xs text-muted-foreground">Ingrese el porcentaje que desea para Mercadería</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pct_fixed_expenses">Gastos Fijos (%)</Label>
          <Input id="pct_fixed_expenses" type="number" min="0" max="100" required value={formData.pct_fixed_expenses} onChange={handleChange} />
          <p className="text-xs text-muted-foreground">Ingrese el porcentaje que desea para Gastos Fijos</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pct_savings">Ahorro (%)</Label>
          <Input id="pct_savings" type="number" min="0" max="100" required value={formData.pct_savings} onChange={handleChange} />
          <p className="text-xs text-muted-foreground">Ingrese el porcentaje que desea para Ahorro</p>
        </div>

        <Button type="submit" className="w-full mt-2">Crear Cuenta</Button>

        <p className="px-6 text-center text-xs text-muted-foreground mt-2">
          ¿Ya tenés una cuenta? <Link to="/login" className="underline underline-offset-4 hover:text-primary">Iniciá sesión</Link>
        </p>

      </div>
    </form>
  )
}