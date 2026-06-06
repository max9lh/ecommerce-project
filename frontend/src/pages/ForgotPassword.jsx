import { useState } from "react"
import { Link } from "react-router-dom"
import api from "@/api/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import botiImg from "../assets/boticompleto.png"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  const manejarSubmit = async (evento) => {
    evento.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const respuesta = await api.post("/auth/forgot-password", { email })
      setSuccess(respuesta.data.message || "Se ha enviado un enlace de recuperación a tu correo.")
    } catch (err) {
      if (err.response?.data?.errors) {
        setError(err.response.data.errors[0].message)
      } else {
        setError(err.response?.data?.message || "Ocurrió un error al procesar la solicitud.")
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
                <h1 className="text-2xl font-bold">Recuperar Contraseña</h1>
                <p className="text-balance text-sm text-muted-foreground">
                  Ingresa tu correo electrónico registrado y te enviaremos un enlace para restablecer tu contraseña.
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
                    {success}
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="nombre@ejemplo.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading || success}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading || success}>
                  {loading ? "Enviando..." : "Enviar enlace de recuperación"}
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
