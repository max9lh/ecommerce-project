import { useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "@/api/api"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"


export function LoginForm({
  className,
  ...props
}) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const { login } = useAuth()
  const manejarSubmit = async (evento) => {
    evento.preventDefault()
    setError("")
    try {
      const respuesta = await api.post("/auth/login", { username, password })
      const { accessToken } = respuesta.data.data
      
      login(accessToken)
      
      navigate("/dashboard")
    } catch (err) {
      if (err.response?.data?.errors) {
        setError(err.response.data.errors[0].message);
      } else {
        setError(err.response?.data?.message || "Usuario o contraseña incorrectos");
      }
    }
  }
  return (
    <form onSubmit={manejarSubmit} className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Bienvenido</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Ingresá tu usuario y contraseña para acceder al sistema
        </p>
      </div>
      <div className="grid gap-6">
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md text-center">
            {error}
          </div>
        )}
        <div className="grid gap-2">
          <Label htmlFor="username">Usuario</Label>
          <Input 
            id="username" 
            type="text" 
            required 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="password">Contraseña</Label>
          </div>
          <Input 
            id="password" 
            type="password" 
            required 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full">
          Login
        </Button>
      </div>
    </form>
  );
}
