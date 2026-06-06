import { useState, useEffect } from "react"
import { Link, useSearchParams, useNavigate } from "react-router-dom"
import api from "@/api/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import botiImg from "../assets/boticompleto.png"

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")
  const navigate = useNavigate()

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) {
      setError("Token de recuperación no válido o inexistente en la URL.")
    }
  }, [token])

  const manejarSubmit = async (evento) => {
    evento.preventDefault()
    setError("")
    setSuccess("")

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.")
      return
    }

    if (newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.")
      return
    }

    setLoading(true)

    try {
      const respuesta = await api.post("/auth/reset-password", {
        token,
        newPassword
      })
      setSuccess(respuesta.data.message || "Tu contraseña se ha restablecido correctamente.")
      // Redirigir al login tras 3 segundos
      setTimeout(() => {
        navigate("/login")
      }, 3000)
    } catch (err) {
      if (err.response?.data?.errors) {
        setError(err.response.data.errors[0].message)
      } else {
        setError(err.response?.data?.message || "Ocurrió un error al restablecer la contraseña.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs flex flex-col gap-6">
            <form onSubmit={manejarSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Nueva Contraseña</h1>
                <p className="text-balance text-sm text-muted-foreground">
                  Ingresa tu nueva contraseña para recuperar el acceso a tu cuenta.
                </p>
              </div>

              <div className="grid gap-4">
                {error && (
                  <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md text-center">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="p-3 text-sm text-green-600 bg-green-500/10 border border-green-500/20 rounded-md text-center">
                    {success} <br />
                    <span className="text-xs text-muted-foreground">Redirigiendo al inicio de sesión...</span>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="newPassword">Nueva Contraseña</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading || success || !token}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading || success || !token}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading || success || !token}>
                  {loading ? "Restableciendo..." : "Restablecer contraseña"}
                </Button>
              </div>

              <div className="text-center text-sm">
                <Link to="/login" className="underline underline-offset-4 hover:text-primary">
                  Volver al inicio de sesión
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <img
          src={botiImg}
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.4] dark:saturate-30"
        />
      </div>
    </div>
  )
}
