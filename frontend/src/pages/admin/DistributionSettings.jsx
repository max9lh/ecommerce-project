import { useState, useEffect } from "react"
import api from "@/api/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Loader2,
  Percent,
  Sliders,
  Save,
  CheckCircle2,
  AlertTriangle,
  Coins,
} from "lucide-react"

export default function DistributionSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const [pctMerchandise, setPctMerchandise] = useState(60)
  const [pctFixedExpenses, setPctFixedExpenses] = useState(30)
  const [pctSavings, setPctSavings] = useState(10)


  const fetchSettings = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get("/admin/distribution")
      const data = res.data.data
      if (data) {
        setPctMerchandise(Math.round(Number(data.pct_merchandise) * 100))
        setPctFixedExpenses(Math.round(Number(data.pct_fixed_expenses) * 100))
        setPctSavings(Math.round(Number(data.pct_savings) * 100))
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error al cargar la configuración de distribución.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const totalSum = Number(pctMerchandise) + Number(pctFixedExpenses) + Number(pctSavings)
  const remaining = 100 - totalSum

  const handleSave = async () => {
    if (totalSum !== 100) {
      setError("La suma de los porcentajes de distribución debe ser exactamente 100%.")
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const payload = {
        pct_merchandise: parseFloat((pctMerchandise / 100).toFixed(2)),
        pct_fixed_expenses: parseFloat((pctFixedExpenses / 100).toFixed(2)),
        pct_savings: parseFloat((pctSavings / 100).toFixed(2)),
      }
      await api.put("/admin/distribution", payload)
      setSuccess("Distribución de ingresos actualizada correctamente.")
      // Esperar un segundo y limpiar el mensaje de éxito
      setTimeout(() => setSuccess(null), 4000)
    } catch (err) {
      setError(err.response?.data?.message || "Error al guardar la distribución.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Distribución de Ingresos</h1>
          <p className="text-sm text-muted-foreground">
            Definí en qué porcentaje se divide automáticamente la caja diaria registrada en el cierre.
          </p>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2">
          <AlertTriangle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-500 flex items-center gap-2">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Sliders className="size-5" />
              </div>
              <div>
                <CardTitle className="text-base">Porcentajes de Presupuesto</CardTitle>
                <CardDescription>
                  Los porcentajes deben sumar exactamente el 100%.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Visualización interactiva / Gráfico de Distribución */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-muted-foreground px-1">
                <span>Esquema de Reparto</span>
                <span className={totalSum === 100 ? "text-emerald-500" : "text-amber-500"}>
                  Total: {totalSum}%
                </span>
              </div>
              
              {/* Barra de progreso segmentada */}
              <div className="h-6 w-full rounded-full overflow-hidden flex bg-muted border border-muted select-none">
                {pctMerchandise > 0 && (
                  <div
                    style={{ width: `${(pctMerchandise / Math.max(totalSum, 100)) * 100}%` }}
                    className="bg-blue-600 h-full flex items-center justify-center text-[10px] text-white font-bold transition-all duration-300"
                    title={`Mercadería: ${pctMerchandise}%`}
                  >
                    {pctMerchandise >= 10 && `${pctMerchandise}%`}
                  </div>
                )}
                {pctFixedExpenses > 0 && (
                  <div
                    style={{ width: `${(pctFixedExpenses / Math.max(totalSum, 100)) * 100}%` }}
                    className="bg-amber-500 h-full flex items-center justify-center text-[10px] text-white font-bold transition-all duration-300"
                    title={`Gastos Fijos: ${pctFixedExpenses}%`}
                  >
                    {pctFixedExpenses >= 10 && `${pctFixedExpenses}%`}
                  </div>
                )}
                {pctSavings > 0 && (
                  <div
                    style={{ width: `${(pctSavings / Math.max(totalSum, 100)) * 100}%` }}
                    className="bg-emerald-500 h-full flex items-center justify-center text-[10px] text-white font-bold transition-all duration-300"
                    title={`Ahorro: ${pctSavings}%`}
                  >
                    {pctSavings >= 10 && `${pctSavings}%`}
                  </div>
                )}
              </div>
              
              {/* Indicador de suma */}
              <div className="flex justify-between items-center text-xs mt-1 px-1">
                <div className="flex gap-4">
                  <span className="flex items-center gap-1"><span className="size-2.5 rounded-full bg-blue-600 inline-block"></span> Mercadería</span>
                  <span className="flex items-center gap-1"><span className="size-2.5 rounded-full bg-amber-500 inline-block"></span> Gastos Fijos</span>
                  <span className="flex items-center gap-1"><span className="size-2.5 rounded-full bg-emerald-500 inline-block"></span> Ahorro</span>
                </div>
                {totalSum !== 100 && (
                  <span className="font-semibold text-amber-600 animate-pulse">
                    {remaining > 0 ? `Falta distribuir: ${remaining}%` : `Exceso: ${Math.abs(remaining)}%`}
                  </span>
                )}
              </div>
            </div>

            <hr className="border-muted" />

            {/* Inputs de configuración */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Mercadería */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="p-merchandise" className="font-semibold">Mercadería</Label>
                  <span className="text-xs text-blue-600 font-bold">{pctMerchandise}%</span>
                </div>
                <div className="relative">
                  <Input
                    id="p-merchandise"
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={pctMerchandise === 0 ? "" : pctMerchandise}
                    onChange={(e) => {
                      const val = Math.min(Math.max(parseInt(e.target.value) || 0, 0), 100)
                      setPctMerchandise(val)
                    }}
                    className="pr-8"
                  />
                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                </div>
                <p className="text-[10px] text-muted-foreground">Destinado a stock y materias primas.</p>
              </div>

              {/* Gastos Fijos */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="p-fixed" className="font-semibold">Gastos Fijos</Label>
                  <span className="text-xs text-amber-500 font-bold">{pctFixedExpenses}%</span>
                </div>
                <div className="relative">
                  <Input
                    id="p-fixed"
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={pctFixedExpenses === 0 ? "" : pctFixedExpenses}
                    onChange={(e) => {
                      const val = Math.min(Math.max(parseInt(e.target.value) || 0, 0), 100)
                      setPctFixedExpenses(val)
                    }}
                    className="pr-8"
                  />
                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                </div>
                <p className="text-[10px] text-muted-foreground">Alquileres, sueldos, servicios, etc.</p>
              </div>

              {/* Ahorro */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="p-savings" className="font-semibold">Ahorro</Label>
                  <span className="text-xs text-emerald-500 font-bold">{pctSavings}%</span>
                </div>
                <div className="relative">
                  <Input
                    id="p-savings"
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={pctSavings === 0 ? "" : pctSavings}
                    onChange={(e) => {
                      const val = Math.min(Math.max(parseInt(e.target.value) || 0, 0), 100)
                      setPctSavings(val)
                    }}
                    className="pr-8"
                  />
                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                </div>
                <p className="text-[10px] text-muted-foreground">Fondo de reserva y reinversiones.</p>
              </div>

            </div>

            {/* Panel de Advertencia */}
            {totalSum !== 100 && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-700 space-y-1">
                <span className="font-bold flex items-center gap-1.5"><AlertTriangle className="size-4 shrink-0 text-amber-500" /> Distribución Incompleta</span>
                <p>
                  Para poder guardar el esquema, la suma de los tres porcentajes debe ser exactamente 100%. Actualmente es de <strong>{totalSum}%</strong>.
                </p>
              </div>
            )}

            {/* Footer de acción */}
            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSave}
                disabled={totalSum !== 100 || saving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 w-full sm:w-auto"
              >
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    Guardar Esquema
                  </>
                )}
              </Button>
            </div>

          </CardContent>
        </Card>
      )}
    </div>
  )
}
