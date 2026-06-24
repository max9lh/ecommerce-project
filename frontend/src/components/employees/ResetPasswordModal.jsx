import { useState } from "react"
import api from "@/api/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Link as LinkIcon, Check, Copy } from "lucide-react"

export default function ResetPasswordModal({ open, onOpenChange, employee }) {
  const [loading, setLoading] = useState(false)
  const [resetUrl, setResetUrl] = useState("")
  const [localError, setLocalError] = useState(null)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    if (!employee) return
    setLocalError(null)
    setResetUrl("")
    setCopied(false)
    setLoading(true)

    try {
      const res = await api.post(`/admin/employees/${employee.id}/reset-link`)
      setResetUrl(res.data.data.resetUrl)
    } catch (err) {
      setLocalError(err.response?.data?.message || "Error al generar enlace")
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!resetUrl) return
    try {
      await navigator.clipboard.writeText(resetUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      setLocalError("No se pudo copiar al portapapeles")
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) {
        setLocalError(null)
        setResetUrl("")
        setCopied(false)
      }
      onOpenChange(val)
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="size-5 text-primary" />
            Recuperar Contraseña
          </DialogTitle>
          <DialogDescription>
            Genera un enlace de recuperación seguro para <strong>@{employee?.username}</strong>.
            Una vez generado, cópialo y envíaselo al empleado.
          </DialogDescription>
          {localError && (
            <div className="mt-2 rounded bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive">
              {localError}
            </div>
          )}
        </DialogHeader>

        <div className="py-4">
          {!resetUrl ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-4">
              <p className="text-sm text-center text-muted-foreground">
                El enlace generado expirará en 1 hora.
              </p>
              <Button onClick={handleGenerate} disabled={loading} className="w-full">
                {loading && <Loader2 className="size-4 animate-spin mr-2" />}
                Generar Enlace Seguro
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">Enlace Generado:</span>
                <div className="flex gap-2">
                  <Input readOnly value={resetUrl} className="font-mono text-xs bg-muted" />
                  <Button variant="secondary" size="icon" onClick={handleCopy}>
                    {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-emerald-600 font-medium text-center bg-emerald-500/10 p-2 rounded">
                ¡Enlace generado exitosamente! Envíalo al empleado.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-3 sm:gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
