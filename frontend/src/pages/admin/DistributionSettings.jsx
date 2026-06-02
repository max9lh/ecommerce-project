import { useState, useEffect, useMemo } from "react"
import api from "@/api/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Loader2,
  Sliders,
  Save,
  CheckCircle2,
  AlertTriangle,
  ShoppingCart,
  Wrench,
  PiggyBank,
  RefreshCw,
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

  const totalSum = useMemo(() => {
    return Number(pctMerchandise) + Number(pctFixedExpenses) + Number(pctSavings)
  }, [pctMerchandise, pctFixedExpenses, pctSavings])

  const remaining = 100 - totalSum
  const isPerfectSum = totalSum === 100

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
      setTimeout(() => setSuccess(null), 4000)
    } catch (err) {
      setError(err.response?.data?.message || "Error al guardar la distribución.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sliders className="size-6 text-amber-500" />
            Distribución de Ingresos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Definí en qué porcentaje se divide automáticamente cada cierre de caja en las bolsas virtuales.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchSettings}
          disabled={loading}
          className="self-start sm:self-center gap-1.5"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          Recargar
        </Button>
      </div>

      {/* Alertas */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2 animate-pulse">
          <AlertTriangle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-500 flex items-center gap-2">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-500 animate-bounce" />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-xl overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Sliders className="size-5 text-amber-500" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">Configuración de Reparto de Caja</CardTitle>
                  <CardDescription className="text-xs">
                    Los porcentajes determinan qué porción del dinero ingresado va a cada bolsa virtual. Debe sumar exactamente 100%.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Esquema Visual Segementado (Premium) */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold px-1">
                  <span className="text-muted-foreground">Esquema Actual de Reparto</span>
                  <span className={`font-mono text-xs font-bold ${isPerfectSum ? "text-emerald-500" : "text-amber-500 animate-pulse"}`}>
                    Suma Total: {totalSum}%
                  </span>
                </div>

                {/* Barra de progreso segmentada interactiva con transiciones suaves */}
                <div className="h-7 w-full rounded-xl overflow-hidden flex bg-muted/30 border border-muted/50 select-none p-0.5 backdrop-blur-md">
                  {pctMerchandise > 0 && (
                    <div
                      style={{ width: `${(pctMerchandise / Math.max(totalSum, 100)) * 100}%` }}
                      className="bg-chart-1 h-full flex items-center justify-center text-[11px] text-white font-bold transition-all duration-300 rounded-l-lg hover:brightness-110"
                      title={`Mercadería: ${pctMerchandise}%`}
                    >
                      {pctMerchandise >= 8 && `${pctMerchandise}%`}
                    </div>
                  )}
                  {pctFixedExpenses > 0 && (
                    <div
                      style={{ width: `${(pctFixedExpenses / Math.max(totalSum, 100)) * 100}%` }}
                      className="bg-chart-2 h-full flex items-center justify-center text-[11px] text-white font-bold transition-all duration-300 hover:brightness-110"
                      title={`Gastos Fijos: ${pctFixedExpenses}%`}
                    >
                      {pctFixedExpenses >= 8 && `${pctFixedExpenses}%`}
                    </div>
                  )}
                  {pctSavings > 0 && (
                    <div
                      style={{ width: `${(pctSavings / Math.max(totalSum, 100)) * 100}%` }}
                      className="bg-chart-3 h-full flex items-center justify-center text-[11px] text-white font-bold transition-all duration-300 rounded-r-lg hover:brightness-110"
                      title={`Ahorro: ${pctSavings}%`}
                    >
                      {pctSavings >= 8 && `${pctSavings}%`}
                    </div>
                  )}
                </div>

                {/* Leyendas con íconos y clases del sistema */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs mt-2 gap-2 px-1 text-muted-foreground">
                  <div className="flex flex-wrap gap-4">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <span className="size-2.5 rounded-full bg-chart-1 inline-block"></span>
                      Mercadería
                    </span>
                    <span className="flex items-center gap-1.5 font-semibold">
                      <span className="size-2.5 rounded-full bg-chart-2 inline-block"></span>
                      Gastos Fijos
                    </span>
                    <span className="flex items-center gap-1.5 font-semibold">
                      <span className="size-2.5 rounded-full bg-chart-3 inline-block"></span>
                      Ahorro
                    </span>
                  </div>
                  {totalSum !== 100 && (
                    <span className="font-bold text-amber-500 animate-pulse text-right">
                      {remaining > 0 ? `Falta distribuir: ${remaining}%` : `Exceso: ${Math.abs(remaining)}%`}
                    </span>
                  )}
                </div>
              </div>

              <hr className="border-muted/50" />

              {/* Controles de Configuración con Sliders Interactivos */}
              <div className="space-y-6">

                {/* 1. Mercadería */}
                <div className="bg-chart-1/5 border border-chart-1/10 rounded-xl p-4 space-y-4 hover:border-chart-1/25 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-chart-1/10 text-chart-1">
                        <ShoppingCart className="size-4" />
                      </div>
                      <div>
                        <Label htmlFor="p-merchandise" className="font-semibold text-sm">Mercadería</Label>
                        <p className="text-[10px] text-muted-foreground">Destinado a reposición de stock y materias primas.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        id="p-merchandise"
                        type="number"
                        min="0"
                        max="100"
                        value={pctMerchandise}
                        onChange={(e) => {
                          const val = Math.min(Math.max(parseInt(e.target.value) || 0, 0), 100)
                          setPctMerchandise(val)
                        }}
                        className="w-16 h-8 text-right font-mono font-bold text-chart-1 focus-visible:ring-chart-1/50"
                      />
                      <span className="text-xs font-bold text-chart-1">%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={pctMerchandise}
                    onChange={(e) => setPctMerchandise(parseInt(e.target.value))}
                    className="w-full accent-chart-1 h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* 2. Gastos Fijos */}
                <div className="bg-chart-2/5 border border-chart-2/10 rounded-xl p-4 space-y-4 hover:border-chart-2/25 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-chart-2/10 text-chart-2">
                        <Wrench className="size-4" />
                      </div>
                      <div>
                        <Label htmlFor="p-fixed" className="font-semibold text-sm">Gastos Fijos (Nómina, Alquileres)</Label>
                        <p className="text-[10px] text-muted-foreground">Destinado a servicios, sueldos, alquileres y gastos operativos.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        id="p-fixed"
                        type="number"
                        min="0"
                        max="100"
                        value={pctFixedExpenses}
                        onChange={(e) => {
                          const val = Math.min(Math.max(parseInt(e.target.value) || 0, 0), 100)
                          setPctFixedExpenses(val)
                        }}
                        className="w-16 h-8 text-right font-mono font-bold text-chart-2 focus-visible:ring-chart-2/50"
                      />
                      <span className="text-xs font-bold text-chart-2">%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={pctFixedExpenses}
                    onChange={(e) => setPctFixedExpenses(parseInt(e.target.value))}
                    className="w-full accent-chart-2 h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* 3. Ahorro */}
                <div className="bg-chart-3/5 border border-chart-3/10 rounded-xl p-4 space-y-4 hover:border-chart-3/25 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-chart-3/10 text-chart-3">
                        <PiggyBank className="size-4" />
                      </div>
                      <div>
                        <Label htmlFor="p-savings" className="font-semibold text-sm">Ahorro / Reservas</Label>
                        <p className="text-[10px] text-muted-foreground">Destinado a fondos de emergencia, contingencia e inversiones a largo plazo.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        id="p-savings"
                        type="number"
                        min="0"
                        max="100"
                        value={pctSavings}
                        onChange={(e) => {
                          const val = Math.min(Math.max(parseInt(e.target.value) || 0, 0), 100)
                          setPctSavings(val)
                        }}
                        className="w-16 h-8 text-right font-mono font-bold text-chart-3 focus-visible:ring-chart-3/50"
                      />
                      <span className="text-xs font-bold text-chart-3">%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={pctSavings}
                    onChange={(e) => setPctSavings(parseInt(e.target.value))}
                    className="w-full accent-chart-3 h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
                  />
                </div>

              </div>

              {/* Panel de Advertencia Dinámico */}
              {!isPerfectSum && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-500 space-y-1.5 animate-pulse">
                  <span className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="size-4 shrink-0 text-amber-500" />
                    El Reparto no suma el 100%
                  </span>
                  <p className="text-muted-foreground">
                    Para poder guardar los cambios, la suma de las tres bolsas debe ser exactamente 100%. Actualmente la suma da <strong>{totalSum}%</strong> (tenés un {remaining > 0 ? `faltante de ${remaining}%` : `exceso de ${Math.abs(remaining)}%`}).
                  </p>
                </div>
              )}

              {/* Footer de acción premium */}
              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSave}
                  disabled={!isPerfectSum || saving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 w-full sm:w-auto px-6 py-5 rounded-xl font-semibold shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  {saving ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Guardando Esquema...
                    </>
                  ) : (
                    <>
                      <Save className="size-4" />
                      Guardar Esquema de Reparto
                    </>
                  )}
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
