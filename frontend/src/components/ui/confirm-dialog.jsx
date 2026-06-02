import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Loader2 } from "lucide-react"

/**
 * ConfirmDialog — Diálogo de confirmación profesional y reutilizable.
 *
 * Reemplaza el uso de `window.confirm()` con una experiencia visual premium.
 *
 * Props:
 *  - open: boolean
 *  - onOpenChange: (open: boolean) => void
 *  - title: string
 *  - description: string | ReactNode
 *  - confirmLabel?: string (default "Confirmar")
 *  - cancelLabel?: string (default "Cancelar")
 *  - variant?: "danger" | "warning" (default "danger")
 *  - loading?: boolean
 *  - onConfirm: () => void
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title = "¿Estás seguro?",
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "danger",
  loading = false,
  onConfirm,
}) {
  const isDanger = variant === "danger"

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!loading) onOpenChange(v) }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
              isDanger
                ? "bg-destructive/15 text-destructive"
                : "bg-amber-500/15 text-amber-500"
            }`}>
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base">{title}</DialogTitle>
              <DialogDescription className="mt-1">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Procesando…
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
