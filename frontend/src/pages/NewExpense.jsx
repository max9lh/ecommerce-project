import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "@/api/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field"
import {
  ArrowLeft,
  ReceiptText,
  PlusCircle,
  Loader2,
  Building2,
  Wallet,
  Calendar,
  CheckCircle2,
} from "lucide-react"

export default function NewExpense() {
  const navigate = useNavigate()

  const [providers, setProviders] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    provider_id: "",
    account_id: "",
    budget_category: "Gastos Fijos",
    amount: "",
    status: "Pagado",
    due_date: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const [provRes, accRes] = await Promise.all([
          api.get("/providers"),
          api.get("/accounts"),
        ])

        const provList = provRes.data.data ?? provRes.data ?? []
        // Filtrar proveedores eliminados
        const activeProvs = provList.filter((p) => !p.name.includes("(ELIMINADO)"))
        const accList = accRes.data.data ?? accRes.data ?? []

        setProviders(activeProvs)
        setAccounts(accList)

        if (activeProvs.length > 0 && accList.length > 0) {
          setFormData((prev) => ({
            ...prev,
            provider_id: String(activeProvs[0].id),
            account_id: String(accList[0].id),
          }))
        }
      } catch (err) {
        setError(err.response?.data?.message || "Error al cargar proveedores o cuentas")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.provider_id) {
      setError("Debes seleccionar un proveedor.")
      return
    }
    if (!formData.account_id) {
      setError("Debes seleccionar una cuenta física de pago.")
      return
    }
    const amt = parseFloat(formData.amount)
    if (isNaN(amt) || amt <= 0) {
      setError("El monto debe ser un número positivo mayor a 0.")
      return
    }
    if (formData.status === "Pendiente" && !formData.due_date) {
      setError("Los egresos pendientes requieren una fecha de vencimiento.")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const payload = {
        provider_id: parseInt(formData.provider_id, 10),
        account_id: parseInt(formData.account_id, 10),
        budget_category: formData.budget_category,
        amount: amt,
        status: formData.status,
        ...(formData.status === "Pendiente" && {
          due_date: `${formData.due_date}T12:00:00.000Z`,
        }),
      }

      await api.post("/expenses", payload)
      setSuccess(true)
    } catch (err) {
      const msg =
        err.response?.data?.errors?.[0]?.message ||
        err.response?.data?.message ||
        "Error al registrar el egreso"
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setFormData((prev) => ({
      ...prev,
      amount: "",
      status: "Pagado",
      due_date: "",
    }))
    setSuccess(false)
    setError(null)
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
              <h2 className="text-2xl font-bold">¡Egreso registrado!</h2>
              <p className="text-sm text-muted-foreground max-w-xs">
                Se registró el gasto por un monto de{" "}
                <span className="font-semibold text-foreground">
                  ${parseFloat(formData.amount).toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                  })}
                </span>{" "}
                de tipo "{formData.budget_category}" con éxito.
              </p>
            </div>
            <div className="flex gap-3 w-full max-w-xs">
              <Button variant="outline" className="flex-1" onClick={handleReset}>
                Cargar otro
              </Button>
              <Button className="flex-1" onClick={() => navigate("/dashboard")}>
                Ir al panel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/dashboard")}
          className="shrink-0"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cargar un Gasto</h1>
          <p className="text-sm text-muted-foreground">
            Registrá un nuevo egreso para compras, servicios o mercadería.
          </p>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive font-semibold">
          {error}
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-amber-500/15 text-amber-500">
                <ReceiptText className="size-5" />
              </div>
              <div>
                <CardTitle>Detalle del Egreso</CardTitle>
                <CardDescription>
                  Ingresá los datos del egreso que se debitará del presupuesto.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <FieldSet>
              <FieldGroup>
                {/* Proveedor */}
                <Field>
                  <FieldLabel htmlFor="provider">Proveedor *</FieldLabel>
                  <div className="relative">
                    <select
                      id="provider"
                      required
                      className="w-full rounded-md border border-input bg-background px-3 py-2.5 pl-10 text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-amber-500 dark:border-border"
                      value={formData.provider_id}
                      onChange={(e) =>
                        setFormData({ ...formData, provider_id: e.target.value })
                      }
                    >
                      {providers.length === 0 ? (
                        <option value="">No hay proveedores registrados</option>
                      ) : (
                        providers.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.payment_condition})
                          </option>
                        ))
                      )}
                    </select>
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  </div>
                </Field>

                {/* Cuenta de fondos */}
                <Field>
                  <FieldLabel htmlFor="account">Cuenta Física o Banco *</FieldLabel>
                  <div className="relative">
                    <select
                      id="account"
                      required
                      className="w-full rounded-md border border-input bg-background px-3 py-2.5 pl-10 text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-amber-500 dark:border-border"
                      value={formData.account_id}
                      onChange={(e) =>
                        setFormData({ ...formData, account_id: e.target.value })
                      }
                    >
                      {accounts.length === 0 ? (
                        <option value="">No hay cuentas registradas</option>
                      ) : (
                        accounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name} (Saldo: ${Number(a.balance).toLocaleString("es-AR")})
                          </option>
                        ))
                      )}
                    </select>
                    <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  </div>
                  <FieldDescription>
                    Cuenta física desde donde se debitará (o se planea debitar) el dinero.
                  </FieldDescription>
                </Field>

                {/* Monto y Bolsa de presupuesto */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="amount">Monto ($) *</FieldLabel>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                        $
                      </span>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        required
                        min="0.01"
                        placeholder="0.00"
                        className="pl-7 font-mono font-semibold"
                        value={formData.amount}
                        onChange={(e) =>
                          setFormData({ ...formData, amount: e.target.value })
                        }
                      />
                    </div>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="budget-category">Bolsa Virtual *</FieldLabel>
                    <select
                      id="budget-category"
                      className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-amber-500 dark:border-border"
                      value={formData.budget_category}
                      onChange={(e) =>
                        setFormData({ ...formData, budget_category: e.target.value })
                      }
                    >
                      <option value="Gastos Fijos">Gastos Fijos</option>
                      <option value="Mercadería">Mercadería</option>
                      <option value="Ahorro">Ahorros</option>
                    </select>
                  </Field>
                </div>

                {/* Estado y Vencimiento */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="status">Estado del Egreso *</FieldLabel>
                    <select
                      id="status"
                      className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-amber-500 dark:border-border"
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value,
                          due_date: e.target.value === "Pagado" ? "" : formData.due_date,
                        })
                      }
                    >
                      <option value="Pagado">Pagado (Débito Inmediato)</option>
                      <option value="Pendiente">Pendiente (A pagar / Crédito)</option>
                    </select>
                  </Field>

                  {formData.status === "Pendiente" && (
                    <Field>
                      <FieldLabel htmlFor="due-date">Fecha de Vencimiento *</FieldLabel>
                      <div className="relative">
                        <Input
                          id="due-date"
                          type="date"
                          required
                          className="pl-10"
                          value={formData.due_date}
                          onChange={(e) =>
                            setFormData({ ...formData, due_date: e.target.value })
                          }
                        />
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                      </div>
                    </Field>
                  )}
                </div>
              </FieldGroup>

              <Button
                type="submit"
                size="lg"
                className="w-full gap-2 mt-4 bg-amber-600 hover:bg-amber-700 text-white"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <PlusCircle className="size-4" />
                    Registrar Egreso
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
