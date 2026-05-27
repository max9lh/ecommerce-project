import { useState, useEffect } from "react"
import api from "@/api/api"
import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SearchBar } from "@/components/ui/search-bar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Loader2,
  PlusCircle,
  Search,
  Store,
  MoreHorizontal,
  Pencil,
  Trash2,
  ShieldAlert,
} from "lucide-react"

const DEFAULT_FORM = { id: null, name: "", payment_condition: "Contado", credit_days: 0 }

export default function ProvidersModule() {
  const { user } = useAuth()
  const isAdmin = user?.role === "ADMIN"
  const canManage = isAdmin || user?.permissions?.canManageProviders === true

  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({ ...DEFAULT_FORM })
  const [saving, setSaving] = useState(false)

  const filtered = providers.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    fetchProviders()
  }, [])

  const fetchProviders = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get("/providers")
      const data = res.data
      if (Array.isArray(data)) {
        setProviders(data)
      } else if (data.success) {
        setProviders(data.data)
      } else {
        setError(data.message || "Error al obtener proveedores")
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error al cargar los proveedores")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const isEditing = !!formData.id
    const url = isEditing ? `/providers/${formData.id}` : "/providers"
    const conditionClean =
      formData.payment_condition === "Crédito" || formData.payment_condition === "Credito"
        ? "Credito"
        : "Contado"

    const payload = {
      name: formData.name,
      payment_condition: conditionClean,
      credit_days: conditionClean === "Credito" ? Number(formData.credit_days) : 0,
    }

    try {
      if (isEditing) {
        await api.put(url, payload)
      } else {
        await api.post(url, payload)
      }
      await fetchProviders()
      closeModal()
    } catch (err) {
      const errData = err.response?.data
      if (errData?.errors) {
        setError(errData.errors.map((e) => e.message).join(", "))
      } else {
        setError(errData?.message || "Error al guardar el proveedor")
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de que querés eliminar este proveedor?")) return
    try {
      await api.delete(`/providers/${id}`)
      await fetchProviders()
    } catch (err) {
      setError(err.response?.data?.message || "Error al eliminar el proveedor")
    }
  }

  const openModal = (provider = null) => {
    if (provider) {
      setFormData({
        id: provider.id,
        name: provider.name,
        payment_condition: provider.payment_condition ?? "Contado",
        credit_days: provider.credit_days ?? 0,
      })
    } else {
      setFormData({ ...DEFAULT_FORM })
    }
    setError(null)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setFormData({ ...DEFAULT_FORM })
    setIsModalOpen(false)
  }

  // ── Sin permiso ──────────────────────────────────────────────
  if (!canManage) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Proveedores</h1>
          <p className="text-sm text-muted-foreground">Catálogo de proveedores vinculados a los egresos.</p>
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted mb-4">
              <ShieldAlert className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Acceso restringido</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              No poseés el permiso <span className="font-mono text-xs">canManageProviders</span> para gestionar los proveedores.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Vista principal ──────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Proveedores</h1>
          <p className="text-sm text-muted-foreground">
            Administrá el catálogo de proveedores vinculados a los egresos.
          </p>
        </div>
        <Button className="gap-2 w-full sm:w-auto justify-center" onClick={() => openModal()}>
          <PlusCircle className="size-4" />
          Nuevo Proveedor
        </Button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Estado vacío */}
      {!loading && providers.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted mb-4">
              <Store className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Sin proveedores registrados</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              Todavía no cargaste ningún proveedor. Hacé clic en "Nuevo Proveedor" para agregar el primero.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tabla */}
      {!loading && providers.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Store className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-base">Listado de Proveedores</CardTitle>
                  <CardDescription>
                    {providers.length} proveedor{providers.length !== 1 ? "es" : ""} registrado{providers.length !== 1 ? "s" : ""}
                  </CardDescription>
                </div>
              </div>

              {/* Búsqueda */}
              <SearchBar
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={setSearchTerm}
              />
            </div>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre Comercial</TableHead>
                  <TableHead>Condición de Pago</TableHead>
                  <TableHead>Días de Crédito</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                      {searchTerm
                        ? `No se encontraron proveedores con "${searchTerm}".`
                        : "No hay proveedores para mostrar."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${p.payment_condition === "Credito"
                            ? "bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800"
                            : "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                            }`}
                        >
                          {p.payment_condition === "Credito" ? "Crédito" : "Contado"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {p.payment_condition === "Credito" ? (
                          <span className="font-mono tabular-nums">{p.credit_days} días</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8 rounded-full">
                              <span className="sr-only">Abrir menú</span>
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuGroup>
                              <DropdownMenuItem onClick={() => openModal(p)}>
                                <Pencil className="size-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => handleDelete(p.id)}
                              >
                                <Trash2 className="size-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Modal crear / editar */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {formData.id ? "Editar Proveedor" : "Registrar Nuevo Proveedor"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="p-name">Nombre Comercial</Label>
              <Input
                id="p-name"
                required
                placeholder="Ej: Distribuidora Central"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="p-condition">Condición de Pago</Label>
              <select
                id="p-condition"
                required
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none"
                value={formData.payment_condition === "Crédito" ? "Credito" : formData.payment_condition}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    payment_condition: e.target.value,
                    credit_days: e.target.value === "Contado" ? 0 : prev.credit_days,
                  }))
                }
              >
                <option value="Contado">Contado</option>
                <option value="Credito">Crédito</option>
              </select>
            </div>

            {(formData.payment_condition === "Credito" || formData.payment_condition === "Crédito") && (
              <div className="space-y-1.5">
                <Label htmlFor="p-days">Días de Crédito</Label>
                <Input
                  id="p-days"
                  type="number"
                  required
                  min={1}
                  placeholder="Ej: 30"
                  value={formData.credit_days === 0 ? "" : formData.credit_days}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, credit_days: parseInt(e.target.value) || 0 }))
                  }
                />
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={closeModal} disabled={saving}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : formData.id ? (
                  "Guardar Cambios"
                ) : (
                  "Registrar"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}