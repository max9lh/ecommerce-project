import { useState, useEffect } from 'react';
import api from '../../api/api';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { CreditCard, FilterX, MoreVertical, Plus, Loader2, ShieldAlert, Clock, CircleDollarSign, Trash2 } from "lucide-react";

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

    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Paginación
    const [page, setPage] = useState(1);
    const [limit] = useState(10); // Mostrar 10 egresos por página
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const [upcomingExpenses, setUpcomingExpenses] = useState([]);
    const [loadingUpcoming, setLoadingUpcoming] = useState(true);

    const [statusFilter, setStatusFilter] = useState('ALL');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [dateFilter, setDateFilter] = useState('');

    const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [payAccountId, setPayAccountId] = useState('');
    const [submittingPay, setSubmittingPay] = useState(false);

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

    const fetchLists = async () => {
        try {
            setLoadingLists(true);
            const [provRes, accRes] = await Promise.all([
                api.get('/providers'),
                api.get('/accounts')
            ]);

            const provs = provRes.data.data ?? provRes.data ?? [];
            const activeProvs = provs.filter(p => !p.name.includes('(ELIMINADO)'));
            const accs = accRes.data.data ?? accRes.data ?? [];

            setProviders(activeProvs);
            setAccounts(accs);

            setCreateFormData(prev => ({
                ...prev,
                provider_id: activeProvs.length > 0 ? String(activeProvs[0].id) : '',
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
                ...(createFormData.status === 'Pendiente' && { due_date: `${createFormData.due_date}T12:00:00.000Z` })
            };

            await api.post('/expenses', payload);
            setIsCreateDialogOpen(false);
            setCreateFormData({
                provider_id: providers.length > 0 ? String(providers[0].id) : '',
                account_id: accounts.length > 0 ? String(accounts[0].id) : '',
                budget_category: 'Gastos Fijos',
                amount: '',
                status: 'Pagado',
                due_date: ''
            });
            fetchExpenses();
            fetchUpcoming();
        } catch (err) {
            alert(err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Error al registrar el egreso.');
        } finally {
            setSubmittingCreate(false);
        }
    };

    const fetchExpenses = async () => {
        try {
            setLoading(true);
            setError('');

            const params = { page, limit };
            if (statusFilter !== 'ALL') params.status = statusFilter;
            if (categoryFilter !== 'ALL') params.budget_category = categoryFilter;
            if (dateFilter) {
                params.from_date = `${dateFilter}T00:00:00.000Z`;
                params.to_date = `${dateFilter}T23:59:59.999Z`;
            }

            const res = await api.get('/expenses', { params });
            const data = res.data;
            if (Array.isArray(data)) {
                setExpenses(data);
                setTotalPages(1);
                setTotal(data.length);
            } else if (data.success) {
                setExpenses(data.data);
                if (data.meta) {
                    setTotalPages(data.meta.totalPages);
                    setTotal(data.meta.total);
                } else {
                    setTotalPages(1);
                    setTotal(data.data.length);
                }
            } else {
                setError(data.message || 'Error al obtener egresos.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error al conectar con el servidor de egresos.');
        } finally {
            setLoading(false);
        }
    };

    const fetchUpcoming = async () => {
        try {
            setLoadingUpcoming(true);
            const res = await api.get('/expenses/upcoming', { params: { days: 15 } });
            setUpcomingExpenses(res.data);
        } catch {
            setUpcomingExpenses([]);
        } finally {
            setLoadingUpcoming(false);
        }
    };

    // Reiniciar página cuando cambian los filtros
    useEffect(() => {
        setPage(1);
    }, [statusFilter, categoryFilter, dateFilter]);

    useEffect(() => {
        if (auth.isAdmin) {
            fetchExpenses();
            fetchUpcoming();
        }
    }, [statusFilter, categoryFilter, dateFilter, page]);

    const handleConfirmPayment = async () => {
        if (!selectedExpense) return;
        if (!payAccountId) {
            alert('Debes seleccionar una cuenta física o banco.');
            return;
        }
        try {
            setSubmittingPay(true);
            await api.put(`/expenses/${selectedExpense.id}/pay`, {
                account_id: parseInt(payAccountId)
            });
            setIsPayDialogOpen(false);
            setSelectedExpense(null);
            fetchExpenses();
            fetchUpcoming();
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
        setPayAccountId(expense.account_id ? String(expense.account_id) : (accounts.length > 0 ? String(accounts[0].id) : ''));
        setIsPayDialogOpen(true);
        if (accounts.length === 0) {
            fetchLists();
        }
    };

    const handleDeleteExpense = async (expenseId) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este egreso? Esta acción es irreversible y no afectará el saldo de tus cuentas ni presupuestos.')) {
            return;
        }

        try {
            await api.delete(`/expenses/${expenseId}`);
            fetchExpenses();
            fetchUpcoming();
        } catch (err) {
            alert(err.response?.data?.message || 'Error al eliminar el egreso.');
        }
    };

    if (!auth.isAdmin) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Egresos Financieros</h1>
                    <p className="text-sm text-muted-foreground">Monitoreá las facturas, compras y estados de pago debitados de las cuentas del administrador.</p>
                </div>
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="flex size-16 items-center justify-center rounded-full bg-muted mb-4">
                            <ShieldAlert className="size-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold">Acceso restringido</h3>
                        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                            Como empleado, no tenés permitido visualizar el listado de egresos financieros generales de la empresa. Acudí a tus formularios de acción directa si necesitás registrar un egreso.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Egresos Financieros</h1>
                    <p className="text-sm text-muted-foreground">
                        Monitoreá las facturas, compras y estados de pago debitados de las cuentas del administrador.
                    </p>
                </div>
                {(auth.isAdmin || auth.permissions.canRegisterExpenses) && (
                    <Button onClick={openCreateDialog} className="gap-2 w-full sm:w-auto justify-center">
                        <Plus className="size-4" />
                        Registrar Egreso
                    </Button>
                )}
            </div>

            {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                </div>
            )}



            {!loadingUpcoming && upcomingExpenses.length > 0 && (
                <Card className="shadow-sm border-amber-500/20">
                    <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-full bg-amber-500/15 text-amber-500">
                                    <Clock className="size-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-base">Próximos a Vencer</CardTitle>
                                    <CardDescription>
                                        Egresos pendientes con vencimiento en los próximos 15 días.
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="flex flex-col sm:items-end">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total a Liquidar</span>
                                <span className="text-xl font-bold text-white dark:text-white font-mono">
                                    ${upcomingExpenses.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="divide-y divide-border rounded-lg border">
                            {upcomingExpenses.map((expense) => {
                                const dDate = new Date(expense.due_date);
                                const dueDateLocalMidnight = new Date(dDate.getFullYear(), dDate.getMonth(), dDate.getDate());
                                const todayLocalMidnight = new Date();
                                todayLocalMidnight.setHours(0, 0, 0, 0);

                                const diffDays = Math.round((dueDateLocalMidnight - todayLocalMidnight) / (1000 * 60 * 60 * 24));
                                const isUrgent = diffDays <= 3;

                                return (
                                    <div key={expense.id} className="flex items-center justify-between gap-4 px-4 py-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`flex size-9 shrink-0 items-center justify-center rounded-full ${isUrgent
                                                ? 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                                                : 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                                                }`}>
                                                <CircleDollarSign className="size-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold truncate">{expense.provider?.name || 'Sin proveedor'}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {expense.budget_category} · Vence {dDate.toLocaleDateString('es-AR')}
                                                    <span className={`ml-1.5 font-semibold ${isUrgent ? 'text-red-500 animate-pulse' : 'text-amber-500'}`}>
                                                        ({diffDays === 0 ? '¡Hoy!' : diffDays === 1 ? '¡Mañana!' : diffDays < 0 ? 'Vencido' : `en ${diffDays} días`})
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="font-mono text-sm font-semibold">
                                                ${parseFloat(expense.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                            </span>
                                            {(auth.isAdmin || auth.permissions.canPayExpenses) && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 rounded-full"
                                                    title="Asentar pago"
                                                    onClick={() => openPayDialog(expense)}
                                                >
                                                    <CreditCard className="size-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
            <Card className="shadow-sm">
                <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                                <CreditCard className="size-5" />
                            </div>
                            <div>
                                <CardTitle className="text-base">Listado de Egresos</CardTitle>
                                <CardDescription>
                                    Visualizá e interactuá con el listado general de egresos del negocio.
                                </CardDescription>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                    <CardContent className="space-y-6">
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

                            <Button variant="outline" onClick={resetFilters} className="w-full flex items-center gap-2">
                                <FilterX className="h-4 w-4 text-muted-foreground" />
                                Limpiar Filtros
                            </Button>
                        </div>

                        <div className="rounded-md border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>F. Registro</TableHead>
                                        <TableHead>F. Vence</TableHead>
                                        <TableHead>Descripción / Proveedor</TableHead>
                                        <TableHead>Categoría</TableHead>
                                        <TableHead>Monto</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        // Skeleton rows — el layout no salta
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <TableRow key={i} className="animate-pulse">
                                                <TableCell><div className="h-3 w-20 rounded bg-muted" /></TableCell>
                                                <TableCell><div className="h-3 w-20 rounded bg-muted" /></TableCell>
                                                <TableCell>
                                                    <div className="h-3 w-32 rounded bg-muted mb-1" />
                                                    <div className="h-2.5 w-20 rounded bg-muted/60" />
                                                </TableCell>
                                                <TableCell><div className="h-5 w-20 rounded-full bg-muted" /></TableCell>
                                                <TableCell><div className="h-3 w-16 rounded bg-muted" /></TableCell>
                                                <TableCell><div className="h-5 w-16 rounded-full bg-muted" /></TableCell>
                                                <TableCell className="text-right"><div className="h-7 w-7 rounded-full bg-muted ml-auto" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : expenses.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center h-40">
                                                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                                    <CreditCard className="size-8 opacity-30" />
                                                    <span className="text-sm font-medium">Sin egresos para los filtros seleccionados</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        expenses.map((expense) => (
                                            <TableRow key={expense.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                                                <TableCell className="font-mono text-xs text-muted-foreground">
                                                    {new Date(expense.created_at).toLocaleDateString('es-AR')}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">
                                                    {expense.due_date ? (
                                                        <span className={expense.status === 'Pendiente' ? 'text-amber-600 font-semibold' : 'text-muted-foreground'}>
                                                            {new Date(expense.due_date).toLocaleDateString('es-AR')}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
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
                                                    {(auth.isAdmin || auth.permissions.canRegisterExpenses || auth.permissions.canPayExpenses) ? (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                                                                    <MoreVertical className="h-4 w-4 text-slate-500" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                {expense.status === 'Pendiente' && (auth.isAdmin || auth.permissions.canPayExpenses) && (
                                                                    <DropdownMenuItem
                                                                        onClick={() => openPayDialog(expense)}
                                                                        className="cursor-pointer text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 dark:focus:bg-emerald-950/30 font-medium"
                                                                    >
                                                                        <CreditCard className="mr-2 h-4 w-4" />
                                                                        Asentar Pago
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {expense.status === 'Pagado' && auth.isAdmin && (
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleDeleteExpense(expense.id)}
                                                                        className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950/30 font-medium"
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        Eliminar Gasto
                                                                    </DropdownMenuItem>
                                                                )}
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

                        {/* Controles de Paginación */}
                        {totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-border">
                                <div className="text-sm text-muted-foreground font-medium">
                                    Mostrando <span className="font-semibold text-foreground">{((page - 1) * limit) + 1}</span> a{" "}
                                    <span className="font-semibold text-foreground">{Math.min(page * limit, total)}</span> de{" "}
                                    <span className="font-semibold text-foreground">{total}</span> egresos
                                </div>
                                <div className="flex items-center gap-1.5 font-sans">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                    >
                                        Anterior
                                    </Button>
                                    
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                                        const isCurrent = p === page;
                                        // Mostrar solo primera, última, actual y adyacentes
                                        if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) {
                                            return (
                                                <Button
                                                    key={p}
                                                    variant={isCurrent ? "default" : "outline"}
                                                    size="sm"
                                                    className={`size-9 p-0 ${isCurrent ? 'bg-primary text-primary-foreground font-bold' : ''}`}
                                                    onClick={() => setPage(p)}
                                                >
                                                    {p}
                                                </Button>
                                            );
                                        }
                                        if (p === 2 || p === totalPages - 1) {
                                            return <span key={p} className="text-muted-foreground px-1">...</span>;
                                        }
                                        return null;
                                    })}

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                    >
                                        Siguiente
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

            <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>¿Confirmar liquidación de egreso?</DialogTitle>
                        <DialogDescription>
                            Esta acción ejecutará una transacción atómica reduciendo instantáneamente el saldo de la cuenta de fondos del Administrador por el importe de esta factura.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedExpense && (
                        <div className="space-y-4">
                            <div className="py-3 px-4 bg-slate-50 dark:bg-muted/20 border border-slate-200 dark:border-border rounded-xl font-mono text-sm space-y-1.5">
                                <p><span className="text-muted-foreground text-xs">Concepto:</span> {selectedExpense.budget_category}</p>
                                <p><span className="text-muted-foreground text-xs">Importe Total:</span> <span className="font-bold text-red-600">${parseFloat(selectedExpense.amount).toFixed(2)}</span></p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground">Cuenta Física o Banco *</label>
                                <select
                                    required
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-emerald-600 dark:border-border"
                                    value={payAccountId}
                                    onChange={e => setPayAccountId(e.target.value)}
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
                        </div>
                    )}
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" onClick={() => setIsPayDialogOpen(false)} disabled={submittingPay}>
                            Abortar
                        </Button>
                        <Button
                            type="button"
                            onClick={handleConfirmPayment}
                            disabled={submittingPay}
                        >
                            {submittingPay ? "Procesando debito..." : "Efectuar Pago"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
                                <Button type="submit" disabled={submittingCreate}>
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
        </div>
    );
}