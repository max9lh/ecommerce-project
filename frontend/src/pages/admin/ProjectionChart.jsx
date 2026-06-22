import { useState, useEffect } from 'react';
import api from '@/api/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, Calendar, AlertTriangle, ShieldCheck,
  Settings2, Plus, Trash2, Edit2, Loader2, Info, ArrowRight, Activity,
  ShoppingCart, Wrench, PiggyBank
} from 'lucide-react';

export default function ProjectionChart() {
  // Configuración de proyección
  const [days, setDays] = useState(30);
  const [basePeriod, setBasePeriod] = useState('14'); // '7', '14', '30', 'custom'
  const [safetyBuffer, setSafetyBuffer] = useState(0);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Estados de datos
  const [projectionData, setProjectionData] = useState(null);
  const [budgetBalances, setBudgetBalances] = useState([]);
  const [loadingProjection, setLoadingProjection] = useState(true);
  const [errorProjection, setErrorProjection] = useState(null);

  // Estados de gastos recurrentes
  const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [loadingRecurring, setLoadingRecurring] = useState(true);
  const [isRecurringDialogOpen, setIsRecurringDialogOpen] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState(null);
  const [recurringFormData, setRecurringFormData] = useState({
    name: '',
    amount: '',
    frequency: 'monthly',
    due_day: '',
    category: 'Gastos Fijos'
  });
  const [submittingRecurring, setSubmittingRecurring] = useState(false);
  const [errorRecurring, setErrorRecurring] = useState(null);

  // Estados de eliminación
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingName, setDeletingName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);


  const fetchProjection = async () => {
    setLoadingProjection(true);
    setErrorProjection(null);
    try {
      const params = {
        days,
        safetyBuffer,
      };

      if (basePeriod === 'custom') {
        if (fromDate && toDate) {
          params.from = fromDate;
          params.to = toDate;
        } else {
          setLoadingProjection(false);
          return;
        }
      } else {
        params.basePeriod = parseInt(basePeriod, 10);
      }

      const res = await api.get('/projection', { params });
      if (res.data && res.data.success) {
        setProjectionData(res.data.data);
      } else {
        setErrorProjection('Error al obtener la proyección de caja.');
      }
    } catch (err) {
      console.error(err);
      setErrorProjection(err.response?.data?.message || 'Error de red al calcular la proyección.');
    } finally {
      setLoadingProjection(false);
    }
  };

  // Carga de gastos recurrentes
  const fetchRecurringExpenses = async () => {
    setLoadingRecurring(true);
    try {
      const res = await api.get('/recurring-expenses');
      if (res.data && res.data.success) {
        setRecurringExpenses(res.data.data);
      }
    } catch (err) {
      console.error('Error al obtener gastos recurrentes:', err);
    } finally {
      setLoadingRecurring(false);
    }
  };

  useEffect(() => {
    fetchProjection();
  }, [days, basePeriod, safetyBuffer, fromDate, toDate]);

  useEffect(() => {
    fetchRecurringExpenses();
    fetchBudgetBalances();
  }, []);

  const fetchBudgetBalances = async () => {
    try {
      const res = await api.get('/accounts/budget-balances');
      if (res.data && res.data.data) {
        setBudgetBalances(res.data.data);
      }
    } catch (err) {
      console.error('Error al obtener bolsas de presupuesto:', err);
    }
  };

  // CRUD Gastos Recurrentes
  const handleOpenCreateRecurring = () => {
    setEditingRecurring(null);
    setRecurringFormData({
      name: '',
      amount: '',
      frequency: 'monthly',
      due_day: '',
      category: 'Gastos Fijos'
    });
    setErrorRecurring(null);
    setIsRecurringDialogOpen(true);
  };

  const handleOpenEditRecurring = (exp) => {
    setEditingRecurring(exp);
    setRecurringFormData({
      name: exp.name,
      amount: exp.amount.toString(),
      frequency: exp.frequency || 'monthly',
      due_day: exp.due_day.toString(),
      category: exp.category
    });
    setErrorRecurring(null);
    setIsRecurringDialogOpen(true);
  };

  const handleSubmitRecurring = async (e) => {
    e.preventDefault();
    setSubmittingRecurring(true);
    setErrorRecurring(null);

    const amt = parseFloat(recurringFormData.amount);
    const day = parseInt(recurringFormData.due_day, 10);

    const freq = recurringFormData.frequency || 'monthly';

    if (isNaN(amt) || amt <= 0) {
      setErrorRecurring('El monto debe ser un número positivo.');
      setSubmittingRecurring(false);
      return;
    }

    if (freq === 'weekly') {
      if (isNaN(day) || day < 0 || day > 6) {
        setErrorRecurring('El día de la semana seleccionado es inválido.');
        setSubmittingRecurring(false);
        return;
      }
    } else {
      if (isNaN(day) || day < 1 || day > 31) {
        setErrorRecurring('El día del mes debe estar entre 1 y 31.');
        setSubmittingRecurring(false);
        return;
      }
    }

    try {
      const payload = {
        name: recurringFormData.name,
        amount: amt,
        frequency: freq,
        due_day: day,
        category: recurringFormData.category
      };

      if (editingRecurring) {
        await api.put(`/recurring-expenses/${editingRecurring.id}`, payload);
      } else {
        await api.post('/recurring-expenses', payload);
      }

      setIsRecurringDialogOpen(false);
      fetchRecurringExpenses();
      fetchProjection(); // Recalcular proyección con el nuevo recurrente
    } catch (err) {
      setErrorRecurring(err.response?.data?.message || 'Error al guardar el gasto recurrente.');
    } finally {
      setSubmittingRecurring(false);
    }
  };

  const handleOpenDeleteRecurring = (exp) => {
    setDeletingId(exp.id);
    setDeletingName(exp.name);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/recurring-expenses/${deletingId}`);
      setIsDeleteDialogOpen(false);
      fetchRecurringExpenses();
      fetchProjection();
    } catch (err) {
      console.error('Error al eliminar gasto recurrente:', err);
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (exp) => {
    try {
      await api.put(`/recurring-expenses/${exp.id}`, { is_active: !exp.is_active });
      fetchRecurringExpenses();
      fetchProjection();
    } catch (err) {
      console.error('Error al alternar estado del gasto recurrente:', err);
    }
  };

  // Preparar datos para Recharts
  const chartData = projectionData?.scenarios?.realistic.map((point, index) => {
    const pessPoint = projectionData.scenarios.pessimistic[index];
    const optPoint = projectionData.scenarios.optimistic[index];
    const dateObj = new Date(point.date);

    return {
      date: dateObj.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }),
      rawDate: point.date,
      Pesimista: pessPoint ? pessPoint.balance : null,
      Realista: point.balance,
      Optimista: optPoint ? optPoint.balance : null,
      expenses: point.expenses || []
    };
  }) || [];

  // Formateador de moneda
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
  };

  const DAYS_OF_WEEK = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

  // Renderizador de Tooltip de Recharts
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const expenses = data.expenses || [];
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs font-sans text-white">
          <p className="font-bold border-b border-slate-700 pb-1.5 mb-1.5 flex items-center gap-1">
            <Calendar className="size-3.5 text-blue-400" />
            {data.rawDate}
          </p>
          <div className="space-y-1">
            <p className="flex justify-between gap-6">
              <span className="text-emerald-400 font-medium">🟢 Esc. Optimista:</span>
              <span className="font-mono font-semibold">{formatCurrency(data.Optimista)}</span>
            </p>
            <p className="flex justify-between gap-6">
              <span className="text-blue-400 font-medium">🔵 Esc. Realista:</span>
              <span className="font-mono font-semibold">{formatCurrency(data.Realista)}</span>
            </p>
            <p className="flex justify-between gap-6">
              <span className="text-amber-400 font-medium">🟡 Esc. Pesimista:</span>
              <span className="font-mono font-semibold">{formatCurrency(data.Pesimista)}</span>
            </p>
          </div>
          {expenses.length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-slate-700">
              <p className="font-semibold text-rose-400 mb-1 flex items-center gap-1">
                <TrendingDown className="size-3 text-rose-400" />
                Vencimientos del Día:
              </p>
              <ul className="space-y-1 list-disc list-inside">
                {expenses.map((e, idx) => (
                  <li key={idx} className="text-[10px] text-slate-300">
                    <span className="font-medium text-slate-200">{e.name}</span>: {formatCurrency(e.amount)} ({e.category})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 w-full pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center">
            Proyección y Planificación de Caja
          </h1>
          <p className="text-sm text-muted-foreground">
            Analizá la liquidez futura de tu local evaluando cierres anteriores combinados con tus egresos planificados y fijos.
          </p>
        </div>
        <Button onClick={handleOpenCreateRecurring} className="gap-1.5 self-start md:self-center">
          <Plus className="size-4" />
          Configurar Recurrente
        </Button>
      </div>

      {/* Controles de Configuración */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-md">
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Horizonte */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Horizonte Proyección</Label>
            <Select value={days.toString()} onValueChange={(val) => setDays(parseInt(val, 10))}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Horizonte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 Días</SelectItem>
                <SelectItem value="30">30 Días (Sugerido)</SelectItem>
                <SelectItem value="60">60 Días</SelectItem>
                <SelectItem value="90">90 Días</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Período Base */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Período de Base (Ingreso)</Label>
            <Select value={basePeriod} onValueChange={setBasePeriod}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 Días</SelectItem>
                <SelectItem value="14">Últimos 14 Días</SelectItem>
                <SelectItem value="30">Últimos 30 Días</SelectItem>
                <SelectItem value="custom">Rango Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Colchón de Caja */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              Safety Buffer (Colchón)
              <Info className="size-3.5 text-muted-foreground" title="El mínimo saldo que querés conservar en caja sin tocar." />
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-muted-foreground">$</span>
              <Input
                type="number"
                min="0"
                placeholder="Ej: 50000"
                value={safetyBuffer || ''}
                onChange={(e) => setSafetyBuffer(parseFloat(e.target.value) || 0)}
                className="pl-6 bg-background"
              />
            </div>
          </div>

          {/* Rango Custom */}
          {basePeriod === 'custom' && (
            <div className="md:col-span-4 grid grid-cols-2 gap-3 pt-2 border-t border-dashed border-border/80">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Desde</Label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Hasta</Label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alerta de Período Informativa */}
      {projectionData && (
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-xs text-blue-400 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Info className="size-4 shrink-0" />
            <span>
              <strong>Promedio calculado:</strong> {formatCurrency(projectionData.baseDailyIncome)}/día basado en {projectionData.periodUsed.days} días (del {new Date(projectionData.periodUsed.from).toLocaleDateString('es-CL')} al {new Date(projectionData.periodUsed.to).toLocaleDateString('es-CL')}).
            </span>
          </div>
          <Badge variant="outline" className="text-blue-400 border-blue-500/20 shrink-0">
            {projectionData.periodUsed.closuresFound} Cierres hallados
          </Badge>
        </div>
      )}

      {/* Gráfico y Métricas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico (Ocupa 2/3) */}
        <Card className="lg:col-span-2 border-border/60 bg-card/60 backdrop-blur-sm shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Proyección del Flujo de Fondos (Sierra)</CardTitle>
            <CardDescription className="text-xs">
              Muestra los ingresos diarios proyectados y las caídas inmediatas en fechas de vencimiento de egresos.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {loadingProjection ? (
              <div className="h-80 flex flex-col items-center justify-center gap-2">
                <Loader2 className="size-8 animate-spin text-emerald-500" />
                <span className="text-xs text-muted-foreground font-mono">Simulando transacciones atómicas...</span>
              </div>
            ) : errorProjection ? (
              <div className="h-80 flex flex-col items-center justify-center gap-2 text-destructive">
                <AlertTriangle className="size-8" />
                <span className="text-xs font-semibold">{errorProjection}</span>
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-80 flex items-center justify-center text-muted-foreground text-xs">
                No hay datos de proyección suficientes.
              </div>
            ) : (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 5, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorOptimistic" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.01} />
                      </linearGradient>
                      <linearGradient id="colorRealistic" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01} />
                      </linearGradient>
                      <linearGradient id="colorPessimistic" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      tickFormatter={(v) => `$${v / 1000}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine
                      y={safetyBuffer}
                      stroke="#ef4444"
                      strokeDasharray="4 4"
                      label={{ value: 'Buffer', position: 'top', fill: '#ef4444', fontSize: 9 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="Optimista"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorOptimistic)"
                    />
                    <Area
                      type="monotone"
                      dataKey="Realista"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorRealistic)"
                    />
                    <Area
                      type="monotone"
                      dataKey="Pesimista"
                      stroke="#f59e0b"
                      strokeWidth={1.5}
                      fillOpacity={1}
                      fill="url(#colorPessimistic)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Panel de Métricas / Liquidez (Ocupa 1/3) */}
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-md flex flex-col justify-between">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Semáforo de Liquidez</CardTitle>
            <CardDescription className="text-xs">
              Diagnóstico inmediato del estado futuro de caja basándonos en tu safety buffer.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 flex-1">
            {loadingProjection ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : projectionData ? (
              <>
                {/* Semáforo Visual */}
                <div className="flex items-center gap-4 p-4 rounded-xl border border-border/80 bg-background/50">
                  <div className={`size-12 rounded-full shrink-0 flex items-center justify-center animate-pulse ${projectionData.liquidityStatus === 'GREEN' ? 'bg-emerald-500/20 text-emerald-500' :
                    projectionData.liquidityStatus === 'YELLOW' ? 'bg-amber-500/20 text-amber-500' :
                      'bg-red-500/20 text-red-500'
                    }`}>
                    {projectionData.liquidityStatus === 'GREEN' ? <ShieldCheck className="size-6" /> : <AlertTriangle className="size-6" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">
                      {projectionData.liquidityStatus === 'GREEN' && 'Estado Verde'}
                      {projectionData.liquidityStatus === 'YELLOW' && 'Estado Amarillo'}
                      {projectionData.liquidityStatus === 'RED' && '¡Estado Crítico!'}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {projectionData.liquidityStatus === 'GREEN' && 'El saldo de caja se mantiene seguro sobre el buffer establecido.'}
                      {projectionData.liquidityStatus === 'YELLOW' && 'El saldo proyectado se acerca peligrosamente al buffer mínimo.'}
                      {projectionData.liquidityStatus === 'RED' && 'La caja presentará saldo negativo en el transcurso del mes.'}
                    </p>
                  </div>
                </div>

                {/* Bolsas de Presupuesto */}
                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block text-center mb-1">
                    Fondos en Bolsas de Presupuesto
                  </span>
                  
                  {['Mercadería', 'Gastos Fijos', 'Ahorro'].map((cat) => {
                    const balObj = budgetBalances.find(b => b.category === cat || (cat === 'Ahorro' && b.category === 'Ahorros'));
                    const bal = balObj ? Number(balObj.balance) : 0;
                    
                    let bgCol = "bg-chart-1/10 text-chart-1 border-chart-1/25";
                    let label = "Mercadería";
                    let Icon = ShoppingCart;
                    
                    if (cat === 'Gastos Fijos') {
                      bgCol = "bg-chart-2/10 text-chart-2 border-chart-2/25";
                      label = "Gastos Fijos";
                      Icon = Wrench;
                    } else if (cat === 'Ahorro') {
                      bgCol = "bg-chart-3/10 text-chart-3 border-chart-3/25";
                      label = "Ahorro";
                      Icon = PiggyBank;
                    }
                    
                    return (
                      <div key={cat} className={`flex items-center justify-between p-3 rounded-xl border ${bgCol} bg-background/40 backdrop-blur-xs`}>
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-7 items-center justify-center rounded-lg bg-current/10">
                            <Icon className="size-4" />
                          </div>
                          <span className="text-xs font-bold text-foreground">{label}</span>
                        </div>
                        <span className="font-mono text-sm font-bold">
                          {formatCurrency(bal)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Día de Colapso */}
                {projectionData.collapseDay && (
                  <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 text-center">
                    <span className="text-xs font-semibold text-rose-500 uppercase tracking-wider block">Día de Colapso Proyectado</span>
                    <span className="text-lg font-bold text-rose-400 block mt-1 flex items-center justify-center gap-1.5">
                      <Calendar className="size-4 shrink-0" />
                      {new Date(projectionData.collapseDay).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                      El flujo realista cruza el cero en esta fecha exacta. Se requiere reprogramar gastos inmediatos.
                    </p>
                  </div>
                )}
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* CRUD de Gastos Recurrentes Inline */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Tus Gastos Recurrentes Programados</CardTitle>
              <CardDescription className="text-xs">
                Administrá tus erogaciones mensuales automáticas que el motor de proyección utiliza para meses futuros.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingRecurring ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : recurringExpenses.length === 0 ? (
            <div className="text-center py-10 border border-dashed rounded-xl text-xs text-muted-foreground">
              Aún no tenés ningún gasto recurrente configurado. Cargá los sueldos fijos, servicios o alquileres del mes.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border/80">
              <table className="w-full text-sm text-left font-sans">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground font-semibold">
                  <tr>
                    <th className="px-4 py-3">Concepto Gasto</th>
                    <th className="px-4 py-3">Bolsa / Categoría</th>
                    <th className="px-4 py-3 text-right">Día de Pago</th>
                    <th className="px-4 py-3 text-right">Importe Mensual</th>
                    <th className="px-4 py-3 text-right">Estado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {recurringExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-muted/10">
                      <td className="px-4 py-3.5 font-medium">{exp.name}</td>
                      <td className="px-4 py-3.5">
                        <Badge variant="outline" className="text-xs bg-slate-100/5 dark:bg-muted/20">
                          {exp.category}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-semibold">
                        {exp.frequency === 'weekly' ? `Semanal (${DAYS_OF_WEEK[exp.due_day]})` : `Día ${exp.due_day} de cada mes`}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-rose-400">
                        {formatCurrency(exp.amount)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Badge
                          onClick={() => handleToggleActive(exp)}
                          className={`cursor-pointer hover:opacity-85 active:scale-95 transition-all select-none ${exp.is_active
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            : 'bg-slate-500/10 text-slate-400 border border-slate-500/10'
                            }`}
                        >
                          {exp.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => handleOpenEditRecurring(exp)}
                          >
                            <Edit2 className="size-3.5 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:bg-destructive/10"
                            onClick={() => handleOpenDeleteRecurring(exp)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para crear/editar Gastos Recurrentes */}
      <Dialog open={isRecurringDialogOpen} onOpenChange={setIsRecurringDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <form onSubmit={handleSubmitRecurring}>
            <DialogHeader>
              <DialogTitle>{editingRecurring ? 'Editar Gasto Recurrente' : 'Configurar Gasto Recurrente'}</DialogTitle>
              <DialogDescription>
                Ingresá las obligaciones mensuales que se repetirán de forma automática en las proyecciones futuras.
              </DialogDescription>
            </DialogHeader>

            {errorRecurring && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-xs font-semibold text-destructive mt-3">
                {errorRecurring}
              </div>
            )}

            <div className="space-y-4 py-4">
              {/* Concepto */}
              <div className="space-y-1.5">
                <Label htmlFor="rec-name" className="text-xs font-semibold">Concepto / Nombre *</Label>
                <Input
                  id="rec-name"
                  placeholder="Ej: Alquiler del Local, Sueldo Fijo Max"
                  required
                  value={recurringFormData.name}
                  onChange={(e) => setRecurringFormData({ ...recurringFormData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Frecuencia */}
                <div className="space-y-1.5">
                  <Label htmlFor="rec-frequency" className="text-xs font-semibold">Frecuencia *</Label>
                  <Select
                    value={recurringFormData.frequency}
                    onValueChange={(val) => setRecurringFormData({ ...recurringFormData, frequency: val, due_day: val === 'weekly' ? '1' : '' })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Frecuencia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensual</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Monto */}
                <div className="space-y-1.5">
                  <Label htmlFor="rec-amount" className="text-xs font-semibold">Importe ($) *</Label>
                  <Input
                    id="rec-amount"
                    type="number"
                    step="0.01"
                    placeholder="Ej: 120000"
                    required
                    value={recurringFormData.amount}
                    onChange={(e) => setRecurringFormData({ ...recurringFormData, amount: e.target.value })}
                  />
                </div>
              </div>

              {/* Programación del día */}
              <div className="space-y-1.5">
                {recurringFormData.frequency === 'weekly' ? (
                  <>
                    <Label htmlFor="rec-day-select" className="text-xs font-semibold">Día de la semana *</Label>
                    <Select
                      value={recurringFormData.due_day}
                      onValueChange={(val) => setRecurringFormData({ ...recurringFormData, due_day: val })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar Día" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Lunes</SelectItem>
                        <SelectItem value="2">Martes</SelectItem>
                        <SelectItem value="3">Miércoles</SelectItem>
                        <SelectItem value="4">Jueves</SelectItem>
                        <SelectItem value="5">Viernes</SelectItem>
                        <SelectItem value="6">Sábado</SelectItem>
                        <SelectItem value="0">Domingo</SelectItem>
                      </SelectContent>
                    </Select>
                  </>
                ) : (
                  <>
                    <Label htmlFor="rec-day" className="text-xs font-semibold">Día del Vencimiento Mensual (1-31) *</Label>
                    <Input
                      id="rec-day"
                      type="number"
                      min="1"
                      max="31"
                      placeholder="Ej: 5"
                      required
                      value={recurringFormData.due_day}
                      onChange={(e) => setRecurringFormData({ ...recurringFormData, due_day: e.target.value })}
                    />
                  </>
                )}
              </div>

              {/* Categoría Bolsa */}
              <div className="space-y-1.5">
                <Label htmlFor="rec-category" className="text-xs font-semibold">Bolsa de Presupuesto Asociada *</Label>
                <Select
                  value={recurringFormData.category}
                  onValueChange={(val) => setRecurringFormData({ ...recurringFormData, category: val })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar Bolsa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Gastos Fijos">Gastos Fijos</SelectItem>
                    <SelectItem value="Mercadería">Mercadería</SelectItem>
                    <SelectItem value="Ahorro">Ahorros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsRecurringDialogOpen(false)} disabled={submittingRecurring}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submittingRecurring}>
                {submittingRecurring ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Configuración'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para Confirmar Eliminación */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription className="text-xs pt-1.5 leading-relaxed">
              ¿Estás seguro de que deseas eliminar permanentemente el gasto recurrente <strong className="text-slate-100 font-semibold">"{deletingName}"</strong>?
              Esta acción es irreversible y ya no se utilizará en las proyecciones futuras.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Eliminando...
                </>
              ) : (
                'Eliminar permanentemente'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
