import { useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "@/api/api"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
<<<<<<< HEAD
import { ShieldAlert, Eye, EyeOff } from "lucide-react"

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { clearMustChangePassword } = useAuth()
=======
import { Loader2, KeyRound, ShieldCheck } from "lucide-react"

export default function ChangePassword() {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login, logout } = useAuth()
>>>>>>> bbcfe4a019fae731e2f373f096b84a2a6bc213a1

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

<<<<<<< HEAD
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas nuevas no coinciden")
      return
    }

    if (newPassword === currentPassword) {
      setError("La nueva contraseña debe ser diferente a la actual")
=======
    if (newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.")
>>>>>>> bbcfe4a019fae731e2f373f096b84a2a6bc213a1
      return
    }

    setLoading(true)
    try {
<<<<<<< HEAD
      await api.post("/auth/change-password", {
        currentPassword,
        newPassword,
      })

      clearMustChangePassword()
      navigate("/dashboard")
    } catch (err) {
      if (err.response?.data?.details) {
        setError(err.response.data.details[0]?.message || "Error de validación")
      } else {
        setError(err.response?.data?.message || "Error al cambiar la contraseña")
=======
      const res = await api.post("/auth/change-password", { newPassword })
      const { accessToken } = res.data.data
      login(accessToken)
      navigate("/dashboard")
    } catch (err) {
      if (err.response?.data?.errors) {
        setError(err.response.data.errors[0].message)
      } else {
        setError(err.response?.data?.message || "Error al cambiar la contraseña.")
>>>>>>> bbcfe4a019fae731e2f373f096b84a2a6bc213a1
      }
    } finally {
      setLoading(false)
    }
  }

  return (
<<<<<<< HEAD
    <div className="flex min-h-svh items-center justify-center p-6 md:p-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20">
            <ShieldAlert className="h-7 w-7 text-amber-500" />
          </div>
          <CardTitle className="text-xl">Cambiar Contraseña</CardTitle>
          <CardDescription className="text-balance">
            Tu cuenta tiene una contraseña temporal. Por seguridad, debés establecer una contraseña personal antes de continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md text-center">
=======
    <div className="flex min-h-svh items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/15 text-primary">
              <KeyRound className="size-7" />
            </div>
          </div>
          <CardTitle className="text-xl">Crear tu Contraseña</CardTitle>
          <CardDescription>
            Tu cuenta fue creada con una contraseña temporal. Por seguridad, elegí una contraseña personal antes de continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive text-center">
>>>>>>> bbcfe4a019fae731e2f373f096b84a2a6bc213a1
                {error}
              </div>
            )}

<<<<<<< HEAD
            <div className="grid gap-2">
              <Label htmlFor="currentPassword">Contraseña Temporal (actual)</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrent ? "text" : "password"}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Ingresá la contraseña que te asignaron"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNew ? "text" : "password"}
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repetí la nueva contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? "Cambiando..." : "Establecer Nueva Contraseña"}
=======
            <div className="space-y-2">
              <Label htmlFor="new-password">Nueva Contraseña</Label>
              <Input
                id="new-password"
                type="password"
                required
                placeholder="Mínimo 8 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
              <Input
                id="confirm-password"
                type="password"
                required
                placeholder="Repetí la contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ShieldCheck className="size-4" />
              )}
              Guardar y Continuar
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full text-xs text-muted-foreground"
              onClick={logout}
            >
              Cerrar sesión
>>>>>>> bbcfe4a019fae731e2f373f096b84a2a6bc213a1
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
