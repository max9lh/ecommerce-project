# 📋 Plan de Desarrollo — Gestor Financiero Automatizado

> Última actualización: 21/05/2026

---

## Estado General

```text
Etapa 1: Infraestructura      ████████████████████ 100% ✅
Etapa 2: Roles y Multi-Usuario ████████░░░░░░░░░░░░  40% 🔄  ← EN PROGRESO
Etapa 3: API Core             ████████████████████ 100% ✅
Etapa 4: Egresos              ████████████████████ 100% ✅
Etapa 5: Asistencia Empleados ░░░░░░░░░░░░░░░░░░░░   0% ⏳
Etapa 6: Frontend             ███░░░░░░░░░░░░░░░░░  15% 🔄
Etapa 7: Prod/Seguridad       ████░░░░░░░░░░░░░░░░  20% 🔄
```

---

## Etapa 1: Infraestructura y Modelado ✅ COMPLETADA

| # | Tarea | Estado |
|---|-------|--------|
| 1.1 | Resolver conflicto `init.sql` vs Prisma (init.sql → solo triggers) | ✅ Hecho |
| 1.2 | Agregar `user_id` a `BudgetAllocation` en Prisma schema | ✅ Hecho |
| 1.3 | Triggers separados en `init.sql` con guards `IF EXISTS` | ✅ Hecho |
| 1.4 | Eliminar archivos placeholder (`s.txt`, `fas.txt`, `a.txt`) | ✅ Hecho |
| 1.5 | Corregir `"main"` en `package.json` | ✅ Hecho |
| 1.6 | Express 5 + middlewares corriendo sin errores en Docker | ✅ Verificado |
| 1.7 | Stack completo levantado y verificado en desarrollo | ✅ Corriendo |

> [!NOTE]
> El `.env` de producción aún tiene valores `TODO_...`. Esto debe corregirse antes del deploy (Etapa 7).

---

## Etapa 2: Roles y Modelo Multi-Usuario 🔄 EN PROGRESO (20%)

Esta etapa reformula la arquitectura de usuarios antes de continuar con la API Core. **Debe completarse antes de implementar nuevos endpoints.**

### 2.A — Cambios en el Schema de Prisma ✅ COMPLETADO

| # | Tarea | Prioridad | Detalle |
|---|-------|-----------|---------||
| 2.1 | **Agregar ENUM `Role`** | ✅ Hecho | `enum Role { ADMIN EMPLOYEE }` creado en `schema.prisma`. Campo `role Role @default(EMPLOYEE)` en el modelo `User`. |
| 2.2 | **Tabla `EmployeePermission`** | ✅ Hecho | Relación 1:1 con `User`. Permisos: `canRegisterClosures`, `canRegisterExpenses`, `canPayExpenses`, `canManageProviders` (todos `false` por defecto). |
| 2.3 | **Tabla `EmployeeProfile`** | ✅ Hecho | Campos: `salary_type`, `hourly_rate`, `monthly_salary?`. Vinculada 1:1 con `User`. |
| 2.4 | **Tabla `AttendanceLog`** | ✅ Hecho | Campos: `check_in`, `check_out?`, `hours_worked?`, `amount_earned?`, `notes?`. Cargada manualmente por el ADMIN. |
| 2.5 | **Migración Prisma** | ✅ Hecho | `20260521222154_add_roles_permissions_attendance` aplicada. 12 tablas + ENUM `Role` en la DB. |

> [!IMPORTANT]
> **Regla de oro del modelo de datos**: Las tablas `Account` y `BudgetBalance` **nunca** se crean para un `EMPLOYEE`. Ambas solo existen vinculadas al usuario con `role = ADMIN`. Toda la lógica financiera opera sobre los registros del ADMIN.

### 2.B — Cambios en la Lógica de Negocio (Backend) ✅ COMPLETADO

| # | Tarea | Estado | Detalle |
|---|-------|--------|---------|
| 2.6 | **Actualizar `auth.service.js` — Register** | ✅ Hecho | Si `role = ADMIN`: crear `Account` + `BudgetBalance` en transacción. Si `role = EMPLOYEE`: crear `User` + `EmployeeProfile` + `EmployeePermission`. |
| 2.7 | **Helper `getAdminContext()`** | ✅ Hecho | `src/utils/adminContext.js`. Devuelve `adminId`, `pct`, `accounts`, `budgets`. |
| 2.8 | **Middleware `requirePermission(permiso)`** | ✅ Hecho | `src/middlewares/requirePermission.js`. ADMIN siempre pasa. EMPLOYEE verificado contra `req.user.permissions` del JWT. |
| 2.9 | **Middleware `requireAdmin()`** | ✅ Hecho | `src/middlewares/requireAdmin.js`. Bloquea con `403` si `req.user.role !== 'ADMIN'`. |
| 2.10 | **Actualizar `closure.service.js`** | ✅ Hecho | Usa `getAdminContext()`. `user_id` guarda quién operó (trazabilidad). Porcentajes leídos del ADMIN. |
| 2.11 | **Actualizar `expense.service.js`** | ✅ Hecho | Descuentos sobre cuentas del ADMIN. `user_id` en `Expense` = quien operó. |

> [!NOTE]
> El JWT ahora incluye `role` y `permissions` en el payload. Los middlewares leen de ahí **sin tocar la DB** en cada request, lo que hace las rutas protegidas muy eficientes.

### 2.C — Gestión de Empleados (Endpoints de Admin)

| # | Tarea | Prioridad | Detalle |
|---|-------|-----------|---------|
| 2.12 | **`POST /api/admin/employees`** | 🔴 Alta | Solo accesible para ADMIN. Crea un usuario con `role = EMPLOYEE`, su `EmployeeProfile` (tarifa/hora o salario fijo) y `EmployeePermission` con los permisos seleccionados. |
| 2.13 | **`GET /api/admin/employees`** | 🔴 Alta | Lista todos los empleados con su perfil y permisos actuales. Solo ADMIN. |
| 2.14 | **`PUT /api/admin/employees/:id/permissions`** | 🔴 Alta | El ADMIN puede cambiar en cualquier momento qué puede hacer un empleado en el sistema. |
| 2.15 | **`PUT /api/admin/employees/:id/profile`** | 🟡 Media | El ADMIN puede actualizar la tarifa por hora o salario de un empleado. |
| 2.16 | **`DELETE /api/admin/employees/:id`** | 🟡 Media | El ADMIN puede desactivar/eliminar un empleado. |

---

## Etapa 3: API Core ✅ COMPLETADO

### Todas las Tareas (API Core)

| # | Tarea | Detalle |
|---|-------|---------|
| 3.1 | **Schemas de validación Zod** | ✅ `schemas.js` con todos los schemas + `validate()` middleware. |
| 3.2 | **Error Handler global** | ✅ `middlewares/errorHandler.js` con 4 params, statusCode fallback, stack en dev. |
| 3.3 | **Auth: Register** | ✅ `POST /api/auth/register` — bcrypt, select sin hash. |
| 3.4 | **Auth: Login** | ✅ `POST /api/auth/login` — JWT con payloads extendidos. |
| 3.5 | **authGuard middleware** | ✅ Lee Bearer token, puebla `req.user`. |
| 3.6 | **Actualización de porcentajes** | ✅ `PUT /api/auth/percentages` — protegida con `authGuard` + `requireAdmin()`. |
| 3.7 | **CRUD Proveedores** | ✅ `POST/GET/PUT/DELETE /api/providers` protegidos con `requirePermission('canManageProviders')`. |
| 3.8 | **Cierre de caja diario** | ✅ `POST /api/closures` protegido con `requirePermission('canRegisterClosures')`. |
| 3.9 | **Distribución automática** | ✅ Uso de `getAdminContext()` en `closure.service.js`. |
| 3.10 | **Gestión de Cuentas (lectura)** | ✅ `GET /api/accounts` protegido con `requireAdmin()`. |

> [!NOTE]
> Las rutas del Core se blindaron exitosamente conectándolas con los middlewares de seguridad de la Etapa 2.

---

## Etapa 4: Control de Egresos ✅ COMPLETADO

| # | Tarea | Estado | Detalle |
|---|-------|--------|---------|
| 4.1 | **Registro de gastos** | ✅ Hecho | `POST /api/expenses` protegido con `requirePermission('canRegisterExpenses')`. |
| 4.2 | **Lógica de estados** | ✅ Hecho | "Pagado" descuenta saldos; "Pendiente" no. Lógica en `expense.service.js`. |
| 4.3 | **Listar egresos** | ✅ Hecho | `GET /api/expenses` protegido con `requireAdmin()`. |
| 4.4 | **Pago de facturas pendientes** | ✅ Hecho | `PUT /api/expenses/:id/pay` protegido con `requirePermission('canPayExpenses')`. |
| 4.5 | **Alertas de vencimiento** | ✅ Hecho | `GET /api/expenses/upcoming` protegido con `requireAdmin()`. |
| 4.6 | **Transacciones atómicas** | ✅ Hecho | `prisma.$transaction()` utilizado correctamente. |

---

## Etapa 5: Control de Asistencia de Empleados ⏳ PENDIENTE (NUEVA)

Este módulo permite registrar la entrada y salida de cada empleado, calcular automáticamente las horas trabajadas y el monto a pagar según su perfil de sueldo.

### 5.A — Lógica de Negocio

| Tipo | Regla |
|------|-------|
| **`salary_type = "hourly"`** | `hours_worked = (check_out - check_in) en horas`. `amount_earned = hours_worked × hourly_rate`. |
| **`salary_type = "fixed"`** | `hours_worked` se calcula igual (para trazabilidad). `amount_earned` no se calcula por registro; se consulta a fin de mes con `monthly_salary`. |

### 5.B — Endpoints

| # | Tarea | Prioridad | Detalle |
|---|-------|-----------|---------|
| 5.1 | **`POST /api/admin/attendance`** | 🔴 Alta | El ADMIN registra un turno manual (entrada y salida) para un empleado. Calcula `hours_worked` y `amount_earned` automáticamente al guardar. |
| 5.2 | **`GET /api/attendance/me`** | 🟡 Media | El empleado ve su propio historial de asistencias cargado por el ADMIN y el total acumulado del período. |
| 5.3 | **`GET /api/admin/attendance`** | 🔴 Alta | El ADMIN ve el historial completo de todos los empleados. Filtrable por empleado y rango de fechas. |
| 5.4 | **`GET /api/admin/attendance/summary`** | 🟡 Media | Resumen por empleado del período (total horas, total a pagar). Útil para liquidación de sueldos. |
| 5.5 | **`PUT /api/admin/attendance/:id`** | 🟡 Media | El ADMIN puede modificar o eliminar un registro de horas. Recalcula monto automáticamente. |

### 5.C — Servicio `attendance.service.js`

| # | Función | Detalle |
|---|---------|---------|
| 5.6 | **`registerAttendance(employeeId, checkIn, checkOut)`** | Valida fechas, calcula duración en horas. Consulta `EmployeeProfile.hourly_rate` y `salary_type`. Calcula `amount_earned`. Crea el registro en la BD. |
| 5.7 | **`getSummaryForPeriod(employeeId, from, to)`** | Agrega totales de horas y monto ganado para liquidación. |

---

## Etapa 6: Frontend Dashboard 🔄 EN PROGRESO (15%)

| # | Tarea | Prioridad | Detalle |
|---|-------|-----------|---------|
| 6.1 | React Router + layout base | 🔴 Alta | ✅ Navegación, rutas protegidas, SidebarPremium. |
| 6.2 | Pantalla de Login / Registro | 🔴 Alta | 🔄 Login completado. Registro pendiente. |
| 6.3 | **Vistas condicionadas por Rol** | 🔴 Alta | El Dashboard completo (saldos, gráficos) solo se muestra si `user.role === 'ADMIN'`. Los empleados ven solo formularios de acción (cierres, gastos según permisos). |
| 6.4 | Dashboard principal (ADMIN) | 🔴 Alta | Saldos de cuentas, bolsas de presupuesto, alertas de vencimiento |
| 6.5 | Módulo de cierre de caja | 🔴 Alta | Formulario de ingreso diario con desglose por medio de pago. Accesible según permiso. |
| 6.6 | Módulo de proveedores | 🟡 Media | CRUD visual con modales de confirmación. Accesible según permiso. |
| 6.7 | Módulo de egresos | 🟡 Media | Lista (solo ADMIN) + acción de "Pagar" según permiso. |
| 6.8 | **Panel de empleados (ADMIN)** | 🔴 Alta | CRUD de empleados, toggle de permisos, visualización de tarifa. |
| 6.9 | **Módulo de Asistencia (EMPLOYEE)** | 🟡 Media | Vista de historial personal de asistencias cargadas por el admin. (No puede cargar horas). |
| 6.10 | **Panel de Asistencia (ADMIN)** | 🔴 Alta | Formulario para cargar horas a empleados manualmente + Vista de resumen de liquidación. |
| 6.11 | Reportes (semanal/mensual/anual) | 🟡 Media | Gráficos con Recharts u otra librería |
| 6.12 | Responsive design (PC + móvil) | 🔴 Alta | El documento lo pide explícitamente |

---

## Etapa 7: Seguridad y Producción 🔄 PARCIAL (20%)

| # | Tarea | Estado | Detalle |
|---|-------|--------|---------|
| 7.1 | Auth completa (Register/Login/Guard) | ✅ Hecho | Implementada en Etapa 3 |
| 7.2 | Validación de inputs con Zod | ✅ Hecho | Todos los schemas definidos |
| 7.3 | **Generar secrets reales en `.env`** | ⏳ Pendiente | Reemplazar `TODO_...` por valores reales antes del deploy |
| 7.4 | **Rate limiting** | ⏳ Pendiente | `express-rate-limit` en `/api/auth/*` para prevenir brute-force |
| 7.5 | **Backups programados** | ⏳ Pendiente | Script `pg_dump` en cron o contenedor dedicado |
| 7.6 | **SSL real con Certbot** | ⏳ Pendiente | Reemplazar certs auto-firmados por Let's Encrypt |
| 7.7 | **Despliegue en VPS** | ⏳ Pendiente | Configurar servidor y CI/CD básico |

---

## Próximos 3 pasos concretos

```text
1. Etapa 2: Migración de schema (ENUM Role, EmployeePermission, EmployeeProfile, AttendanceLog)
2. Etapa 2: Helper getAdminContext() + middlewares requireAdmin() / requirePermission()
3. Etapa 3: Actualizar closure.service.js y expense.service.js para usar el contexto del ADMIN
```

---

## Consideraciones de Calidad (recordatorio)

### 🏗️ Arquitectura
- **Capas estrictas**: Controller → Service → Prisma. Los controllers **nunca** consultan la DB directamente.
- **Sin IDs mágicos**: Nunca hardcodear `id: 1`. La identidad del ADMIN se obtiene siempre mediante `getAdminContext()` que busca por `role = 'ADMIN'` en la DB.
- Crear un `routes/index.js` central cuando haya 3+ routers montados en `app.js`.

### 💰 Finanzas
- **Siempre `Decimal(15,2)`**, nunca Float para dinero ✅ ya implementado
- **`prisma.$transaction()`** es obligatorio en cierre de caja, pago de egresos y check-out de asistencia
- Los saldos siempre se modifican sobre las cuentas del **ADMIN** — los empleados **nunca** tienen cuentas propias

### 🔐 Seguridad
- **Nunca devolver `password_hash`** — usar `select` de Prisma ✅ ya implementado
- **`requireAdmin()`** protege todos los endpoints de lectura de saldos, resúmenes financieros y gestión de empleados
- **`requirePermission()`** es granular: un empleado puede poder registrar cierres pero no pagar gastos
- **CORS restrictivo en producción** — configurar `origin` específico, no `cors()` a secas

### 🧪 Testing (cuando el backend esté completo)
- `jest` + `supertest` para tests de integración de endpoints críticos
- La separación `app.js` / `server.js` permite importar la app sin levantar el servidor ✅
