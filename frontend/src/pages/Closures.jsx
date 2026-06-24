import { useNavigate, useParams } from "react-router-dom"
import { useClosure } from "@/hooks/useClosure"
import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field"
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  ClipboardList,
  Landmark,
  Loader2,
  Wallet,
} from "lucide-react"

const accountIcons = {
  efectivo: Wallet,
  caja: Wallet,
  banco: Landmark,
  bancaria: Landmark,
}

function getAccountIcon(name) {
  const lower = name.toLowerCase()
  for (const [key, Icon] of Object.entries(accountIcons)) {
    if (lower.includes(key)) return Icon
  }
  return Banknote
}

export default function Closures() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    accounts,
    amounts,
    totalAmount,
    detailsSum,
    isValid,
    loading,
    submitting,
    error,
    success,
    setAmount,
    setTotalAmount,
    submit,
    reset,
  } = useClosure(id)

  const handleSubmit = (e) => {
    e.preventDefault()
    submit()
  }

  if (success) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="flex flex-col items-center gap-6 py-12">
            <div className="flex size-20 items-center justify-center rounded-full bg-emerald-500/15">
              <CheckCircle2 className="size-10 text-emerald-500" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">{id ? "¡Cierre modificado!" : "¡Cierre registrado!"}</h2>
              <p className="text-sm text-muted-foreground max-w-xs">
                Se {id ? "modificaron" : "registraron"} <span className="font-semibold text-foreground">${totalAmount.toLocaleString("es-CL")}</span> correctamente.
              </p>
            </div>
            <div className="flex gap-3 w-full max-w-xs">
              {id ? (
                <Button className="w-full" onClick={() => navigate("/cierres")}>
                  Volver al registro
                </Button>
              ) : (
                <>
                  <Button variant="outline" className="flex-1" onClick={reset}>
                    Nuevo cierre
                  </Button>
                  <Button className="flex-1" onClick={() => navigate("/dashboard")}>
                    Ir al panel
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // --- Vista de carga ---
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(id ? "/cierres" : "/dashboard")}
          className="shrink-0"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {id ? `Editar Cierre de Caja #${id}` : "Cierre de Caja Diario"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {id ? "Modificá los ingresos del día desglosados por medio de pago." : "Registrá los ingresos del día desglosados por medio de pago."}
          </p>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-primary shrink-0">
                <ClipboardList className="size-5" />
              </div>
              <div>
                <CardTitle>{id ? "Modificar Cierre de Caja" : "Registro de Caja"}</CardTitle>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <FieldSet>
              <FieldGroup>
                {/* Monto Total */}
                <Field>
                  <FieldLabel htmlFor="total-amount">Monto Total del Día</FieldLabel>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                      $
                    </span>
                    <Input
                      id="total-amount"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="pl-7 text-lg font-semibold h-12"
                      value={totalAmount || ""}
                      onChange={(e) => setTotalAmount(Number(e.target.value) || 0)}
                    />
                  </div>
                  <FieldDescription>
                    Suma total de ingresos del día (efectivo + banco).
                  </FieldDescription>
                </Field>

                <FieldSeparator>Desglose por medio de pago</FieldSeparator>

                {/* Inputs dinámicos por cuenta */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {accounts.map((account) => {
                    const Icon = getAccountIcon(account.name)
                    return (
                      <Field key={account.id}>
                        <FieldLabel htmlFor={`account-${account.id}`}>
                          <span className="flex items-center gap-2">
                            <Icon className="size-4 text-muted-foreground" />
                            {account.name}
                          </span>
                        </FieldLabel>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                            $
                          </span>
                          <Input
                            id={`account-${account.id}`}
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            className="pl-7"
                            value={amounts[account.id] || ""}
                            onChange={(e) =>
                              setAmount(account.id, e.target.value)
                            }
                          />
                        </div>
                        <FieldDescription>
                          Saldo actual: ${Number(account.balance).toLocaleString("es-CL")}
                        </FieldDescription>
                      </Field>
                    )
                  })}
                </div>

                {/* Validación visual de la suma */}
                {totalAmount > 0 && (
                  <div
                    className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm transition-colors ${isValid
                      ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
                      : "border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400"
                      }`}
                  >
                    <span>
                      Suma del desglose: <span className="font-semibold">${detailsSum.toLocaleString("es-CL")}</span>
                    </span>
                    <span className="font-medium">
                      {isValid ? "Coincide" : `Faltan $${(totalAmount - detailsSum).toLocaleString("es-CL")}`}
                    </span>
                  </div>
                )}

                {!isValid && totalAmount > 0 && detailsSum > totalAmount && (
                  <FieldError>
                    El desglose supera al monto total en ${(detailsSum - totalAmount).toLocaleString("es-CL")}
                  </FieldError>
                )}
              </FieldGroup>

              <Button
                type="submit"
                size="lg"
                className="w-full gap-2"
                disabled={!isValid || submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {id ? "Guardando..." : "Registrando..."}
                  </>
                ) : (
                  <>
                    <ClipboardList className="size-4" />
                    {id ? "Guardar Cambios" : "Registrar Cierre de Caja"}
                  </>
                )}
              </Button>
            </FieldSet>
          </CardContent>
        </Card>
      </form>


    </div>
  )
}
