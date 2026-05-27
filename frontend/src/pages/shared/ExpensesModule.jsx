import { useState, useEffect } from 'react';
import api from '../../api/api';

// Importaciones de Shadcn/ui
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Iconos de Lucide
import { CreditCard, FilterX, MoreVertical, Plus, Loader2 } from "lucide-react";

// Helper para leer el rol y permisos directamente del Token guardado
function getAuthContext() {
    const token = localStorage.getItem("token");
    if (!token) return { role: null, permissions: {} };
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return {
            role: payload.role,
            permissions: payload.permissions || {},
            isAdmin: payload.role === 'ADMIN'
        };
    } catch {
        return { role: null, permissions: {} };
    }
}

export default function ExpensesModule() {
    const auth = getAuthContext();

    // Estados de datos
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Estados para filtros reactivos (Pedido en la Tarea 4.3)
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [dateFilter, setDateFilter] = useState('');

    // Estados para el diálogo de confirmación de pago
    const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [submittingPay, setSubmittingPay] = useState(false);

    // Estados para registrar nuevo egreso
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [providers, setProviders] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loadingLists, setLoadingLists] = useState(false);
    const [submittingCreate, setSubmittingCreate] = useState(false);
    const [createFormData, setCreateFormData] = useState({
        provider_id: '',
        account_id: '',
        budget_category: 'Gastos Fijos',
        amount: '',
        status: 'Pagado',
        due_date: ''
    });

    // Carga de listados auxiliares de proveedores y cuentas físicas
    const fetchLists = async () => {
        try {
            setLoadingLists(true);
            const [provRes, accRes] = await Promise.all([
                api.get('/providers'),
                api.get('/accounts')
            ]);

            const provs = provRes.data.data ?? provRes.data ?? [];
            const accs = accRes.data.data ?? accRes.data ?? [];

            setProviders(provs);
            setAccounts(accs);

            // Valores por defecto
            setCreateFormData(prev => ({
                ...prev,
                provider_id: provs.length > 0 ? String(provs[0].id) : '',
                account_id: accs.length > 0 ? String(accs[0].id) : ''
            }));
        } catch (err) {
            console.error("Error al cargar proveedores o cuentas:", err);
        } finally {
            setLoadingLists(false);
        }
    };

    const openCreateDialog = () => {
        setIsCreateDialogOpen(true);
        fetchLists();
    };

    // Registro del nuevo egreso (POST a la API)
    const handleCreateExpense = async (e) => {
        e.preventDefault();

        if (!createFormData.provider_id) {
            alert('Debes seleccionar un proveedor.');
            return;
        }
        if (!createFormData.account_id) {
            alert('Debes seleccionar una cuenta física.');
            return;
        }
        const amt = parseFloat(createFormData.amount);
        if (isNaN(amt) || amt <= 0) {
            alert('El monto debe ser un número positivo.');
            return;
        }
        if (createFormData.status === 'Pendiente' && !createFormData.due_date) {
            alert('Los egresos pendientes requieren una fecha de vencimiento.');
            return;
        }

        try {
            setSubmittingCreate(true);
            const payload = {
                provider_id: parseInt(createFormData.provider_id),
                account_id: parseInt(createFormData.account_id),
                budget_category: createFormData.budget_category,
                amount: amt,
                status: createFormData.status,
                ...(createFormData.status === 'Pendiente' && { due_date: new Date(createFormData.due_date).toISOString() })
            };

            await api.post('/expenses', payload);
            setIsCreateDialogOpen(false);
            // Limpiar formulario
            setCreateFormData({
                provider_id: providers.length > 0 ? String(providers[0].id) : '',
                account_id: accounts.length > 0 ? String(accounts[0].id) : '',
                budget_category: 'Gastos Fijos',
                amount: '',
                status: 'Pagado',
                due_date: ''
            });
            fetchExpenses(); // Recargar grilla
        } catch (err) {
            alert(err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Error al registrar el egreso.');
        } finally {
            setSubmittingCreate(false);
        }
    };

    // Carga de egresos con filtros aplicados directamente a las Query Strings de la API
    const fetchExpenses = async () => {
        try {
            setLoading(true);
            setError('');

            // Construimos los parámetros de búsqueda dinámicamente con las claves correctas para el Backend
            const params = {};
            if (statusFilter !== 'ALL') params.status = statusFilter;
            if (categoryFilter !== 'ALL') params.budget_category = categoryFilter;
            if (dateFilter) {
                params.from_date = `${dateFilter}T00:00:00.000Z`;
                params.to_date = `${dateFilter}T23:59:59.999Z`;
            }

            const res = await api.get('/expenses', { params });
            setExpenses(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al conectar con el servidor de egresos.');
        } finally {
            setLoading(false);
        }
    };

    // Escucha cambios en los filtros para refrescar la tabla de forma asíncrona
    useEffect(() => {
        // Regla 6.3 / 6.7: Solo el ADMIN puede ver o listar la tabla de egresos en el Dashboard
        if (auth.isAdmin) {
            fetchExpenses();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter, categoryFilter, dateFilter]);

    // Función que dispara el PUT atómico hacia el Backend para asentar el pago (Tarea 4.4)
    const handleConfirmPayment = async () => {
        if (!selectedExpense) return;
        try {
            setSubmittingPay(true);
            await api.put(`/expenses/${selectedExpense.id}/pay`);
            setIsPayDialogOpen(false);
            setSelectedExpense(null);
            fetchExpenses(); // Recarga la lista inmediatamente reflejando los nuevos saldos del ADMIN
        } catch (err) {
            alert(err.response?.data?.message || 'Ocurrió un error al procesar el pago en el servidor.');
        } finally {
            setSubmittingPay(false);
        }
    };

    const resetFilters = () => {
        setStatusFilter('ALL');
        setCategoryFilter('ALL');
        setDateFilter('');
    };

    const openPayDialog = (expense) => {
        setSelectedExpense(expense);
        setIsPayDialogOpen(true);
    };

    // RESTRICCIÓN DE PANTALLA COMPLETA (Regla 4.3 / 6.3 del plan de desarrollo)
    if (!auth.isAdmin) {
        return (
            <Card className="max-w-md border-amber-200 bg-amber-50/50 mt-10">
                <CardHeader>
                    <CardTitle className="text-amber-700 text-lg">Acceso Condicionado por Rol</CardTitle>
                    <CardDescription className="text-amber-600">
                        Como empleado, no tenés permitido visualizar la sábana o listado de egresos financieros generales de la empresa. Acudí a tus formularios de acción directa si necesitás registrar un egreso.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card className="max-w-5xl shadow-sm">
            <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <CardTitle className="text-2xl font-bold tracking-tight">💸 Control de Egresos</CardTitle>
                        <CardDescription>Monitoreá las facturas, compras y estados de pago debitados de las cuentas del administrador.</CardDescription>
                    </div>
                    {(auth.isAdmin || auth.permissions.canRegisterExpenses) && (
                        <Button onClick={openCreateDialog} className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Registrar Egreso
                        </Button>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* BARRA DE FILTROS (DISEÑO RESPONSIVE PC/MÓVIL) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-slate-50 dark:bg-muted/20 border border-slate-200 dark:border-border rounded-lg items-end">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Estado</label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="bg-white dark:bg-background">
                                <SelectValue placeholder="Filtrar por estado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Todos los estados</SelectItem>
                                <SelectItem value="Pendiente">Pendiente</SelectItem>
                                <SelectItem value="Pagado">Pagado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Categoría</label>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="bg-white dark:bg-background">
                                <SelectValue placeholder="Filtrar categoría" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Todas las categorías</SelectItem>
                                <SelectItem value="Mercadería">Mercadería</SelectItem>
                                <SelectItem value="Gastos Fijos">Gastos Fijos</SelectItem>
                                <SelectItem value="Ahorro">Ahorros</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Fecha Específica</label>
                        <div className="relative">
                            <Input
                                type="date"
                                className="bg-white dark:bg-background pr-8"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                            />
                        </div>
                    </div>

                    <Button variant="outline" onClick={resetFilters} className="w-full flex items-center gap-2 bg-white dark:bg-background">
                        <FilterX className="h-4 w-4 text-muted-foreground" />
                        Limpiar Filtros
                    </Button>
                </div>

                {error && <div className="p-3 text-sm bg-orange-50 border border-orange-200 text-orange-800 rounded-lg">{error}</div>}

                {/* TABLA DE EGRESOS DE SHADCN */}
                {loading ? (
                    <p className="text-sm text-muted-foreground animate-pulse py-4">Sincronizando transacciones de egresos...</p>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Descripción / Proveedor</TableHead>
                                    <TableHead>Categoría</TableHead>
                                    <TableHead>Monto</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {expenses.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                            No se encontraron egresos con los filtros seleccionados.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    expenses.map((expense) => (
                                        <TableRow key={expense.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                                            <TableCell className="font-mono text-xs text-muted-foreground">
                                                {new Date(expense.created_at).toLocaleDateString('es-AR')}
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-semibold text-slate-900 dark:text-slate-100">{expense.budget_category}</div>
                                                <div className="text-xs text-muted-foreground">Prov: {expense.provider?.name || 'Particular'}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-slate-600 dark:text-slate-300 bg-slate-100/50 dark:bg-muted/30 border border-slate-200 dark:border-border">
                                                    {expense.budget_category}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
                                                ${parseFloat(expense.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={
                                                    expense.status === 'Pagado'
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800 border hover:bg-green-100 shadow-none'
                                                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 border hover:bg-amber-100 shadow-none'
                                                }>
                                                    {expense.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {/* CONDICIONAL DE ACCIÓN PAGO: Si el egreso está PENDIENTE y el usuario es ADMIN o tiene el permiso granular 'canPayExpenses' */}
                                                {expense.status === 'Pendiente' && (auth.isAdmin || auth.permissions.canPayExpenses) ? (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                                                                <MoreVertical className="h-4 w-4 text-slate-500" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                onClick={() => openPayDialog(expense)}
                                                                className="cursor-pointer text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 dark:focus:bg-emerald-950/30 font-medium"
                                                            >
                                                                <CreditCard className="mr-2 h-4 w-4" />
                                                                Asentar Pago
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground font-mono">—</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>

            {/* MODAL / DIALOG DE SHADCN PARA CONFIRMAR EL PAGO */}
            <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>¿Confirmar liquidación de egreso?</DialogTitle>
                        <DialogDescription>
                            Esta acción ejecutará una transacción atómica reduciendo instantáneamente el saldo de la cuenta de fondos del Administrador por el importe de esta factura.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedExpense && (
                        <div className="py-3 px-4 bg-slate-50 dark:bg-muted/20 border border-slate-200 dark:border-border rounded-xl font-mono text-sm space-y-1.5">
                            <p><span className="text-muted-foreground text-xs">Concepto:</span> {selectedExpense.budget_category}</p>
                            <p><span className="text-muted-foreground text-xs">Importe Total:</span> <span className="font-bold text-red-600">${parseFloat(selectedExpense.amount).toFixed(2)}</span></p>
                        </div>
                    )}
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" onClick={() => setIsPayDialogOpen(false)} disabled={submittingPay}>
                            Abortar
                        </Button>
                        <Button
                            type="button"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={handleConfirmPayment}
                            disabled={submittingPay}
                        >
                            {submittingPay ? "Procesando debito..." : "Efectuar Pago"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MODAL / DIALOG DE SHADCN PARA REGISTRAR NUEVO EGRESO */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle>Registrar Nuevo Egreso</DialogTitle>
                        <DialogDescription>
                            Registrá una factura o gasto del negocio. Al marcarlo como "Pagado", se debitará automáticamente de la cuenta seleccionada.
                        </DialogDescription>
                    </DialogHeader>
                    {loadingLists ? (
                        <div className="flex items-center justify-center py-8 gap-2 text-sm text-muted-foreground font-mono">
                            <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                            Cargando proveedores y cuentas...
                        </div>
                    ) : (
                        <form onSubmit={handleCreateExpense} className="space-y-4 pt-2">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground">Proveedor *</label>
                                <select
                                    required
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-emerald-600 dark:border-border"
                                    value={createFormData.provider_id}
                                    onChange={e => setCreateFormData({ ...createFormData, provider_id: e.target.value })}
                                >
                                    {providers.length === 0 ? (
                                        <option value="">No hay proveedores registrados</option>
                                    ) : (
                                        providers.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} ({p.payment_condition})</option>
                                        ))
                                    )}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground">Cuenta Física de Pago *</label>
                                <select
                                    required
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-emerald-600 dark:border-border"
                                    value={createFormData.account_id}
                                    onChange={e => setCreateFormData({ ...createFormData, account_id: e.target.value })}
                                >
                                    {accounts.length === 0 ? (
                                        <option value="">No hay cuentas registradas</option>
                                    ) : (
                                        accounts.map(a => (
                                            <option key={a.id} value={a.id}>{a.name} (Saldo: ${parseFloat(a.balance).toLocaleString('es-AR', { minimumFractionDigits: 2 })})</option>
                                        ))
                                    )}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground">Bolsa de Presupuesto *</label>
                                    <select
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-emerald-600 dark:border-border"
                                        value={createFormData.budget_category}
                                        onChange={e => setCreateFormData({ ...createFormData, budget_category: e.target.value })}
                                    >
                                        <option value="Gastos Fijos">Gastos Fijos</option>
                                        <option value="Mercadería">Mercadería</option>
                                        <option value="Ahorro">Ahorros</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground">Monto ($) *</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        required
                                        min="0.01"
                                        placeholder="Ej: 1500.00"
                                        value={createFormData.amount}
                                        onChange={e => setCreateFormData({ ...createFormData, amount: e.target.value })}
                                        className="dark:border-border"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground">Estado *</label>
                                    <select
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-emerald-600 dark:border-border"
                                        value={createFormData.status}
                                        onChange={e => setCreateFormData({ ...createFormData, status: e.target.value, due_date: e.target.value === 'Pagado' ? '' : createFormData.due_date })}
                                    >
                                        <option value="Pagado">Pagado</option>
                                        <option value="Pendiente">Pendiente</option>
                                    </select>
                                </div>

                                {createFormData.status === 'Pendiente' && (
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-muted-foreground">Fecha Vencimiento *</label>
                                        <Input
                                            type="date"
                                            required
                                            value={createFormData.due_date}
                                            onChange={e => setCreateFormData({ ...createFormData, due_date: e.target.value })}
                                            className="dark:border-border"
                                        />
                                    </div>
                                )}
                            </div>

                            <DialogFooter className="pt-3 gap-2">
                                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={submittingCreate}>
                                    Cancelar
                                </Button>
                                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={submittingCreate}>
                                    {submittingCreate ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Registrando...
                                        </>
                                    ) : (
                                        'Registrar'
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </Card>
    );
}