import React, { useState, useEffect } from 'react';
import api from '../../api/api';

// Importaciones de componentes nativos de shadcn/ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PencilIcon, ShareIcon, TrashIcon } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";

// Helper para decodificar el token y ver permisos
function hasPermission(permissionName) {
    const token = localStorage.getItem("token");
    if (!token) return false;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role === 'ADMIN') return true;
        return payload.permissions?.[permissionName] === true;
    } catch (e) {
        return false;
    }
}

const DEFAULT_FORM = { id: null, name: '', payment_condition: 'Contado', credit_days: 0 };

export default function ProvidersModule() {

    // Estados para la API
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Estados para el Modal de shadcn (sirve para Crear y Editar)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ ...DEFAULT_FORM });

    // 1. Control de Seguridad en la UI: Si no tiene permisos, bloqueamos la pantalla completa
    if (!hasPermission('canManageProviders')) {
        return (
            <Card className="max-w-md mx-auto border-red-200 bg-red-50/50 mt-10">
                <CardHeader>
                    <CardTitle className="text-red-700 text-lg">Acceso Denegado</CardTitle>
                    <CardDescription className="text-red-600">
                        No poseés el permiso granular `canManageProviders` para gestionar los proveedores del negocio.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    // 2. Efecto para cargar los datos al montar la vista
    useEffect(() => {
        fetchProviders();
    }, []);

    // 3. Petición GET al Backend
    // El backend devuelve el array directo (no envuelto en { success, data })
    const fetchProviders = async () => {
        try {
            setLoading(true);
            const res = await api.get('/providers');
            const data = res.data;

            // El servicio devuelve el array directo
            if (Array.isArray(data)) {
                setProviders(data);
            } else if (data.success) {
                setProviders(data.data);
            } else {
                setError(data.message || 'Error al obtener proveedores');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    };

    // 4. Petición POST / PUT (Guardar datos)
    const handleSubmit = async (e) => {
        e.preventDefault();
        const isEditing = !!formData.id;
        const url = isEditing ? `/providers/${formData.id}` : '/providers';
        const conditionClean = (formData.payment_condition === 'Credito' || formData.payment_condition === 'Crédito')
            ? 'Credito'
            : 'Contado';

        const payload = {
            name: formData.name,
            payment_condition: conditionClean,
            credit_days: conditionClean === 'Credito' ? Number(formData.credit_days) : 0,
        };

        try {
            const res = isEditing
                ? await api.put(url, payload)
                : await api.post(url, payload);

            fetchProviders(); // Recargamos la tabla de inmediato
            closeModal();
        } catch (err) {
            const errData = err.response?.data;
            // Zod devuelve { errors: [...] }
            if (errData?.errors) {
                alert(errData.errors.map(e => e.message).join('\n'));
            } else {
                alert(errData?.message || 'Error en el servidor al guardar');
            }
        }
    };

    // 5. Petición DELETE (Eliminar)
    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de que querés eliminar este proveedor?')) return;

        try {
            await api.delete(`/providers/${id}`);
            fetchProviders();
        } catch (err) {
            alert(err.response?.data?.message || 'Error al eliminar el proveedor');
        }
    };

    // Helpers para abrir y cerrar el modal reseteando estados
    const openModal = (provider = null) => {
        if (provider) {
            setFormData({
                id: provider.id,
                name: provider.name,
                // El operador ?? evita que strings vacíos bugeen la selección
                payment_condition: provider.payment_condition ?? 'Contado',
                credit_days: provider.credit_days ?? 0,
            });
        } else {
            setFormData({ ...DEFAULT_FORM });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setFormData({ ...DEFAULT_FORM });
        setIsModalOpen(false);
    };


    return (
        <Card className="max-w-5xl mx-auto shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-5">
                <div>
                    <CardTitle className="text-2xl font-bold tracking-tight">📦 Gestión de Proveedores</CardTitle>
                    <CardDescription>Administrá el catálogo de proveedores vinculados a los egresos.</CardDescription>
                </div>
                {/* Botón para abrir el modal vacío (Creación) */}
                <Button onClick={() => openModal()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    + Nuevo Proveedor
                </Button>
            </CardHeader>

            <CardContent>
                {error && <div className="p-3 mb-4 text-sm bg-orange-50 border border-orange-200 text-orange-800 rounded-lg">{error}</div>}

                {loading ? (
                    <p className="text-sm text-muted-foreground animate-pulse">Cargando proveedores...</p>
                ) : (
                    <div className="rounded-md border">
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
                                {providers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                            No hay proveedores registrados en el sistema.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    providers.map((p) => (
                                        <TableRow key={p.id} className="hover:bg-slate-50/50">
                                            <TableCell className="font-medium text-slate-900">{p.name}</TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${p.payment_condition === 'Credito'
                                                    ? 'bg-amber-100 text-amber-800'
                                                    : 'bg-green-100 text-green-800'
                                                    }`}>
                                                    {p.payment_condition}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {p.payment_condition === 'Credito'
                                                    ? <span className="font-mono">{p.credit_days} días</span>
                                                    : <span className="text-slate-400 font-mono">—</span>
                                                }
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="outline">Actions</Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent>
                                                        <DropdownMenuGroup>
                                                            <DropdownMenuItem onClick={() => openModal(p)}>
                                                                <PencilIcon variant="link" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem>
                                                                <ShareIcon />
                                                                Share
                                                            </DropdownMenuItem>
                                                        </DropdownMenuGroup>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuGroup>
                                                            <DropdownMenuItem variant="destructive" onClick={() => handleDelete(p.id)}>
                                                                <TrashIcon />
                                                                Delete
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
                    </div>
                )}
            </CardContent>

            {/* MODAL CON UN SOLO FORMULARIO DIALOG DE SHADCN */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{formData.id ? 'Editar Proveedor' : 'Registrar Nuevo Proveedor'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 pt-2">

                        {/* 1. CAMPO: NOMBRE COMERCIAL */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-muted-foreground">Nombre Comercial *</label>
                            <Input
                                required
                                placeholder="Ej: Distribuidora Central"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        {/* 2. CAMPO: CONDICIÓN DE PAGO (Migrado completamente a shadcn/ui) */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-muted-foreground">Condición de Pago *</label>
                            <Select
                                value={formData.payment_condition === 'Crédito' ? 'Credito' : formData.payment_condition}
                                onValueChange={(value) => setFormData({
                                    ...formData,
                                    payment_condition: value,
                                    // Si cambia a 'Contado', forzamos los días de crédito a 0 automáticamente
                                    credit_days: value === 'Contado' ? 0 : formData.credit_days
                                })}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Seleccione una condición" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Contado">Contado</SelectItem>
                                    <SelectItem value="Credito">Crédito</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* 3. CAMPO CONDICIONAL: DÍAS DE CRÉDITO */}
                        {formData.payment_condition === 'Credito' && (
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-muted-foreground">Días de Crédito *</label>
                                <Input
                                    type="number"
                                    required
                                    min={1}
                                    placeholder="Ej: 30"
                                    value={formData.credit_days}
                                    // Parseamos a entero para asegurar que viajen números limpios a Prisma
                                    onChange={e => setFormData({ ...formData, credit_days: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        )}

                        {/* BOTONES DE ACCIÓN */}
                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={closeModal}>Cancelar</Button>
                            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                {formData.id ? 'Guardar Cambios' : 'Registrar'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </Card>
    );
}