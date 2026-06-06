# 🎯 Manual Funcional 
## Gestor Financiero Automatizado 

El **Gestor Financiero Automatizado** es una plataforma diseñada específicamente para un comercio en especifico, con funcionalidades hechas a medida para el dueño de dicho comercio y sus empleados. Su objetivo principal es simplificar la administración diaria, automatizar la distribución del dinero y dar visibilidad total sobre la salud financiera del negocio, evitando sorpresas al final del mes.

---

## 📑 Tabla de Contenidos
1. [¿Qué problemas resuelve al cliente?](#1-qué-problemas-resuelve-al-cliente)
2. [Lógica de Negocio y Estructura Financiera](#2-lógica-de-negocio-y-estructura-financiera)
3. [Módulos Clave de la Aplicación](#3-módulos-clave-de-la-aplicación)
4. [Flujos de Trabajo Operativos (Ejemplos Reales)](#4-flujos-de-trabajo-operativos-ejemplos-reales)
5. [Roles de Usuario y Permisos](#5-roles-de-usuario-y-permisos)
6. [Seguridad: Recuperación de Contraseñas](#6-seguridad-recuperación-de-contraseñas-por-correo)

---

## 1. ¿Qué problemas resuelve al cliente?

Dirigir un comercio minorista o PyME implica lidiar con el desorden de billetes físicos, las transferencias electrónicas y los gastos imprevistos. Este sistema resuelve los dolores de cabeza más comunes:

### 💰 A. El problema de la "Caja Única" (Bolsillos Rotos)
*   **El dolor**: Todo el dinero que entra va a una única cuenta o caja. El dueño gasta de ahí para pagar mercadería, alquiler y gastos personales. Al final del mes, no sabe si el negocio dio ganancia o si está consumiendo su capital de trabajo.
*   **La solución**: **Distribución Automática por Bolsas**. Cada vez que se registra una venta o cierre diario, el sistema separa de forma transparente y matemática el dinero en tres bolsas independientes: **Mercadería (60%)**, **Gastos Fijos (30%)** y **Reserva/Ahorro (10%)** (porcentajes ajustables por el dueño). Si no hay saldo en la bolsa de mercadería, no se puede gastar en mercadería, protegiendo los fondos de otros sectores.

### 💳 B. Descontrol de Saldos (Efectivo vs. Transferencias)
*   **El dolor**: Es difícil conciliar cuánto dinero debería haber físicamente en caja y cuánto en el banco, especialmente cuando hay empleados operando el negocio.
*   **La solución**: Registro estructurado por métodos de pago. Las entradas de dinero se desglosan en efectivo y transferencias bancarias, actualizando saldos físicos en tiempo real.

### 📅 C. Olvido de Pagos y Vencimientos de Proveedores
*   **El dolor**: El comerciante compra mercadería a crédito, se olvida de la fecha de vencimiento y el proveedor suspende las entregas o cobra intereses.
*   **La solución**: **Calendario y Alertas de Vencimiento**. El sistema avisa cuáles facturas están pendientes de pago y cuáles vencen en los próximos días o están vencidas, organizándolas por prioridad.

### 👥 D. Robo Hormiga y Falta de Trazabilidad
*   **El dolor**: Los empleados manejan la caja y el inventario, pero no hay registro de quién autorizó un retiro, quién ingresó una venta o quién pagó un gasto.
*   **La solución**: **Auditoría de Operaciones y Permisos**. Los empleados tienen usuarios individuales. Cada cierre de caja, gasto o pago queda registrado con la firma digital de la persona que lo operó. El administrador decide mediante permisos granulares qué empleado puede registrar cierres, registrar gastos o pagar facturas.

### ⏰ E. Pérdida de Tiempo Liquidando Sueldos
*   **El dolor**: Calcular cuántas horas trabajó cada empleado por semana o mes, multiplicar por el valor de hora y restar adelantos se hace en hojas de papel propensas a errores.
*   **La solución**: **Módulo de Asistencia Automatizado**. El administrador carga las horas y turnos de los empleados. Para empleados por hora, el sistema calcula automáticamente los montos ganados según su tarifa por hora, listando resúmenes de nómina listos para pagar.

---

## 2. Lógica de Negocio y Estructura Financiera

La aplicación opera bajo un modelo financiero de dos capas: **Saldos Físicos** y **Saldos Virtuales (Bolsas)**.

```
                  ┌──────────────────────────────────────────────┐
                  │          CIERRE DIARIO DE INGRESOS           │
                  │   (Ej: $100,000 en Efectivo/Transferencia)   │
                  └──────────────────────┬───────────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼ (Saldos Físicos)                              ▼ (Saldos Virtuales)
       ┌──────────────────┐                              ┌───────────────────────────┐
       │ CUENTAS REALES   │                              │ BOLSAS DE PRESUPUESTO     │
       │                  │                              │ (Distribución Automática) │
       │ - Efectivo       │                              │ - Mercadería (60%)        │
       │ - Banco          │                              │ - Gastos Fijos (30%)      │
       │                  │                              │ - Ahorros (10%)           │
       └──────────────────┘                              └───────────────────────────┘
```

*   **Saldos Físicos (Cuentas)**: Es la representación del dinero real en el negocio. Si tienes $50.000 físicos en el cajón y $50.000 en el banco, tu saldo físico total es $100.000.
*   **Saldos Virtuales (Presupuesto/Bolsas)**: Es la distribución inteligente del dinero. De esos $100.000 totales, el sistema etiqueta $60.000 únicamente para reposición de stock (Mercadería), $30.000 para alquiler y luz (Gastos Fijos) y $10.000 como ganancia neta o reserva (Ahorro).
*   **Consistencia**: Cada egreso disminuye tanto el saldo físico (de dónde salió el dinero) como la bolsa de presupuesto correspondiente (a qué corresponde el gasto).

---

## 3. Módulos Clave de la Aplicación

### 📋 Módulo 1: Cierre de Caja Diario
Permite al operador o cajero realizar el arqueo de caja al terminar la jornada laboral.
*   **Desglose de Ingresos**: Se registra cuánto se cobró en efectivo y cuánto por medios bancarios (transferencias, tarjetas, etc.).
*   **Corte Limpio**: Al guardar el cierre, el sistema actualiza inmediatamente los saldos de Efectivo y Cuenta Bancaria del dueño y realiza la subdivisión de los montos a las bolsas correspondientes de forma invisible.

### 📉 Módulo 2: Control de Egresos y Proveedores
Maneja las salidas de dinero para el correcto abastecimiento.
*   **Gastos Pagados**: Descuentan el dinero inmediatamente del efectivo o banco.
*   **Gastos Pendientes**: Permite registrar facturas recibidas de proveedores a crédito. El dinero no se descuenta hasta que se marca explícitamente como "Pagado".
*   **Políticas de Crédito**: Cada proveedor tiene configurada su condición de pago (Contado o Crédito con N días de plazo) para calcular automáticamente cuándo vencerán los pagos.

### ⏰ Módulo 3: Asistencia y Liquidación (Payroll)
Gestión y control de las jornadas de los empleados.
*   **Registro de Horas**: Control de entradas (`Check-in`) y salidas (`Check-out`) cargados en el sistema.
*   **Estructuras de Salario**:
    *   *Sueldo Fijo*: Liquidación fija a fin de mes.
    *   *Tarifa por Hora*: El sistema calcula los minutos trabajados en el rango de fechas, aplica el costo por hora del empleado y genera la planilla de pagos sugerida.

### 📊 Módulo 4: Dashboard y Proyecciones Financieras
La central de inteligencia para el dueño del negocio.
*   **KPIs en tiempo real**: Balance general de efectivo, banco, bolsas y nivel de deuda con proveedores.
*   **Proyecciones de Flujo**: Algoritmos sencillos que comparan las facturas prontas a vencer contra los saldos actuales para indicar alertas de liquidez (ej. *"Cuidado: Tienes vencimientos por $80,000 esta semana pero solo $45,000 en el banco"*).

---

## 4. Flujos de Trabajo Operativos (Ejemplos Reales)

### Escenario A: Registrar el día de trabajo y pagar los servicios
1.  Al finalizar el día, el cajero cuenta $40.000 en efectivo y ve $20.000 en transferencias en el home banking.
2.  Ingresa a la app y registra un **Cierre Diario** por $60.000 ($40.000 en Efectivo, $20.000 en Banco).
3.  El sistema asigna:
    *   $36.000 a la bolsa de **Mercadería** (60%)
    *   $18.000 a la bolsa de **Gastos Fijos** (30%)
    *   $6.000 a la bolsa de **Ahorro** (10%)
4.  El dueño debe pagar la factura de luz por $10.000. Registra un egreso de la bolsa de **Gastos Fijos** pagado desde **Cuenta Bancaria**.
5.  El sistema descuenta $10.000 del banco (saldo físico) y reduce la bolsa de **Gastos Fijos** a $8.000. La bolsa de Mercadería y el Ahorro quedan intactos.

### Escenario B: Compra de mercadería a crédito
1.  El proveedor de bebidas entrega mercadería por $50.000. Otorga un plazo de pago de 15 días.
2.  El dueño registra el gasto como **Pendiente** asociado a la bolsa de **Mercadería** con fecha de vencimiento a 15 días.
3.  Los saldos de efectivo y banco no sufren modificaciones, pero el panel de control muestra una alerta de "Deuda Próxima a Vencer" por $50.000.
4.  A los 15 días, el dueño paga al repartidor con efectivo de la caja. Accede al panel, busca la factura pendiente y presiona **Pagar** seleccionando la cuenta **Efectivo**.
5.  El sistema descuenta los $50.000 del Efectivo físico y de la bolsa de Mercadería, archivando la factura como pagada.

---

## 5. Roles de Usuario y Permisos

Para proteger la información más delicada de la empresa, la plataforma cuenta con controles de acceso estrictos basados en roles y permisos individuales:

| Operación / Vista | Administrador (ADMIN) | Empleado (Con permisos) | Empleado (Sin permisos) |
| :--- | :---: | :---: | :---: |
| **Ver balances de cuentas y bancos** | ✅ Sí | ❌ No | ❌ No |
| **Configurar % de distribución** | ✅ Sí | ❌ No | ❌ No |
| **Registrar Cierres Diarios** | ✅ Sí | ✅ Sí  | ❌ No |
| **Registrar Egresos Pendientes** | ✅ Sí | ✅ Sí  | ❌ No |
| **Aprobar Pagos de Egresos** | ✅ Sí | ✅ Sí  | ❌ No |
| **Agregar/Editar Proveedores** | ✅ Sí | ✅ Sí  | ❌ No |
| **Controlar Asistencia de Personal**| ✅ Sí | ❌ No | ❌ No |
| **Ver su propio historial de horas** | ✅ Sí | ✅ Sí | ✅ Sí |

---
## 6. Seguridad: Recuperación de Contraseñas por Correo

El sistema cuenta con un mecanismo de autoservicio para la recuperación de claves para prevenir el bloqueo de cuentas:
* **Solicitud de Enlace**: Desde la pantalla de inicio de sesión, el usuario puede acceder a "¿Olvidaste tu contraseña?" e ingresar su email.
* **Token Temporal Seguro**: El sistema genera un token de un solo uso criptográficamente seguro y envía un correo con validez de **1 hora** para restablecer la contraseña.
* **Restablecimiento**: Al ingresar la nueva contraseña, se revocan automáticamente todas las sesiones activas en otros dispositivos (`refresh_token_hash` se limpia) para garantizar la seguridad.

> [!NOTE]
> Esta función requiere que las cuentas tengan configurado un correo electrónico y que el administrador haya configurado un servidor de correo (SMTP) en el archivo `.env`.

---
*Este manual funcional provee el entendimiento del valor práctico de la aplicación para el cliente final y sus operaciones diarias.*

