# Requerimientos Funcionales del Proyecto

## 1. Gestión de Saldos y Caja Inicial
* [cite_start]**Carga Inicial:** Permite al usuario ingresar manualmente su saldo inicial en "Banco" y "Efectivo"[cite: 2, 3].
* [cite_start]**Actualización en Tiempo Real:** El sistema recalcula el saldo total (Banco + Efectivo) automáticamente cada vez que se registra un ingreso o un egreso[cite: 4, 5].

## 2. Registro de Ingresos (Cierre de Caja Diario)
* [cite_start]**Formulario de Ingreso:** Registro de ventas diarias detallando monto total, medio de pago (Efectivo, Débito, Transferencia) y fecha del cierre[cite: 6, 7, 8, 9, 10].
* [cite_start]**Distribución Automática:** Al ingresar un monto, el sistema aplica automáticamente porcentajes configurados (ej: 60% Mercadería, 30% Arriendo/Gastos Fijos, 10% Ahorro)[cite: 11].

## 3. Gestión de Proveedores
* [cite_start]**CRUD de Proveedores:** Administración completa (Crear, leer, actualizar y eliminar) de proveedores, incluyendo nombre, contacto y rubro[cite: 12, 13].
* [cite_start]**Condiciones de Pago:** Configuración de términos de pago, diferenciando entre proveedores que aceptan crédito (ej: 7 o 15 días) o pago de contado[cite: 14].

## 4. Gestión de Egresos (Pagos)
* [cite_start]**Registro de Pagos:** Vinculación directa de cada pago a un proveedor existente[cite: 15, 16].
* [cite_start]**Tipos de Egreso:** Clasificación entre "Gasto Operativo" (luz, agua), "Mercadería" o "Arriendo"[cite: 17].
* [cite_start]**Control de Deudas:** Si el pago es a crédito, el sistema lo marca como "Pendiente" y registra su fecha de vencimiento[cite: 18].

## 5. Reportes y Dashboard
* [cite_start]**Vista Principal:** Visualización de saldo en banco, saldo en efectivo y presupuesto disponible por categoría[cite: 19, 20].
* **Resúmenes Automáticos:** Generación de reportes de:
    * [cite_start]Gastos por proveedor[cite: 21, 22].
    * [cite_start]Comparativa de ingresos vs. egresos semanales, mensuales y anuales[cite: 23].
