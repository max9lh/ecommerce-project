# 📑 DOSSIER DE ENTREGA Y CIERRE DE PROYECTO

## Gestor Financiero Automatizado

Este documento constituye el dossier de entrega formal del software **Gestor Financiero Automatizado**.
---------------------------------------------------------------------------------------------------

<div style="page-break-after: always; break-after: page;"></div>

## 📄 HOJA 1: PORTADA FORMAL

`<br><br>`

<div align="center">
  <img src="frontend/src/assets/boticompleto.png" alt="Logo Gestor Financiero" width="200" style="margin-bottom: 20px; border-radius: 12px;"/>

# 🎯 GESTOR FINANCIERO AUTOMATIZADO

### Dossier Oficial de Entrega y Cierre de Proyecto

<br>

  **Estado del Proyecto:** `LISTO PARA PRODUCCIÓN`
  **Versión del Software:** `1.0.0`
  **Fecha de Emisión:** Junio 2026

</div>

`<br><br>``<br>`

### 👥 Datos del Proyecto

* **Cliente / Comercio Beneficiario:** [Nombre del Comercio Cliente / Dueño]
* **Desarrollador / Proveedor:** Equipo de Ingeniería de Software
* **Plataforma de Despliegue:** Docker Compose / Vercel
* **Base de Datos:** PostgreSQL 16 (Relacional)

`<br><br>``<br>`

<div align="center">
  <small>Este documento contiene información confidencial de carácter técnico, presupuestario y operativo. Su distribución no autorizada está prohibida.</small>
</div>

---

<!-- PAGE BREAK -->

<div style="page-break-after: always; break-after: page;"></div>

## 📄 HOJA 2: INTRODUCCIÓN Y ANEXO DE REQUERIMIENTOS

### 1. Introducción

El **Gestor Financiero Automatizado** ha sido diseñado y desarrollado a medida para solucionar el desorden del manejo de fondos en "Caja Única". Mediante la distribución matemática del dinero ingresado en **Bolsas Presupuestarias Virtuales (Mercadería 60%, Gastos Fijos 30% y Ahorro 10%)**, el negocio adquiere previsibilidad financiera total, trazabilidad en los flujos diarios y protección de su capital de trabajo.

---

### 2. Anexo de Requerimientos Funcionales (RF)

El sistema cuenta con las siguientes funcionalidades operativas validadas:

* **RF-01: Cierre Diario de Caja**: Registro unificado de ingresos desglosado por métodos de pago (**Efectivo** y **Banco**).
* **RF-02: Distribución Presupuestaria**: Algoritmo en segundo plano que subdivide los ingresos en bolsas según los porcentajes definidos.
* **RF-03: Control de Egresos y Proveedores**: Registro de facturas pagadas e ingresos de facturas a crédito con vencimientos calculados por proveedor.
* **RF-04: Asistencia y Nómina (Payroll)**: Control de asistencia del personal por turnos (`Check-in` / `Check-out`), registro de perfiles con correo electrónico y cálculo automatizado de sueldos (fijos y por horas trabajadas).
* **RF-05: Dashboard de Inteligencia**: Visualización de KPIs financieros clave (saldo real, fondos asignados a bolsas y deudas prontas a vencer).
* **RF-06: Recuperación de Claves por Correo**: Sistema de autoservicio seguro (Gmail SMTP) con tokens temporales de un solo uso de corta duración (1 hora) y revocación automática de sesiones previas.

---

### 3. Anexo de Requerimientos No Funcionales (RNF)

* **RNF-01: Seguridad de Credenciales**: Las contraseñas de los usuarios se almacenan encriptadas con `bcrypt` (12 rondas). Los tokens de recuperación se procesan hasheados en SHA-256 en base de datos.
* **RNF-02: Sesiones Seguras**: Uso de cookies con propiedades `HttpOnly` y `Secure` para el almacenamiento y refresco automático de tokens de sesión JWT.
* **RNF-03: Modularidad en Contenedores (Docker)**: La base de datos PostgreSQL se encuentra aislada en una subred privada interna (`backend_network`), impidiendo accesos directos desde el exterior.
* **RNF-04: Hardening del Servidor (Nginx)**: Proxy inverso con limitación de solicitudes (*Rate Limiting*) para mitigar ataques de fuerza bruta, políticas de transporte seguro HSTS y SSL Let's Encrypt automático (Webroot).
* **RNF-05: Respaldo Automatizado**: Script programado (`cron`) diario para volcado comprimido de la base de datos con rotación automática de 30 días.

---

<!-- PAGE BREAK -->

<div style="page-break-after: always; break-after: page;"></div>

## 📄 HOJA 3: PRESUPUESTO DE INFRAESTRUCTURA E INVENTARIO DE CREDENCIALES

### 1. Presupuesto Estimado de Operación Mensual

La infraestructura elegida para el sistema optimiza la relación coste/rendimiento, utilizando servicios Cloud modernos:

| Concepto                               | Proveedor sugerido                             | Frecuencia de Pago | Costo Estimado               |
| :------------------------------------- | :--------------------------------------------- | :----------------- | :--------------------------- |
| **Backend & Base de Datos**      | Railway (Servicio Administrado) o VPS Linux    | Mensual            | USD $5.00 - $10.00           |
| **Frontend (React)**             | Vercel (Hobby Plan)                            | Mensual            | **Gratuito ($0.00)**   |
| **Dominio Web**                  | Registrador de Dominios (ej: Nic.ar / GoDaddy) | Anual              | USD $10.00 - $15.00 / año   |
| **Servidor SMTP (Correos)**      | Gmail (Personal) / Resend (Developer)          | Mensual            | **Gratuito ($0.00)**   |
| **Certificados SSL**             | Let's Encrypt / Certbot                        | -                  | **Gratuito ($0.00)**   |
| **COSTO MENSUAL TOTAL ESTIMADO** |                                                | **Mensual**  | **USD $5.00 - $10.00** |

---

### 2. Inventario de Credenciales (Las "Llaves" del Sistema)

El resguardo de las credenciales es responsabilidad exclusiva del administrador del sistema. Los siguientes secretos de producción se configuran en el archivo seguro `.env` del servidor:

* **Database Credentials**:
  * `DATABASE_URL`: String de conexión directa a la base de datos PostgreSQL en producción. Contiene el usuario del motor, puerto, nombre de la base de datos y la contraseña secreta de administración de Postgres.
* **Seguridad y Criptografía**:
  * `JWT_SECRET`: Llave criptográfica de alta entropía de 64 bytes para firmar los Access Tokens de corta duración.
  * `REFRESH_SECRET`: Llave criptográfica independiente para firmar los Refresh Tokens de sesión persistente (30 días).
* **Configuración del Correo Electrónico (Gmail SMTP)**:
  * `SMTP_HOST`: `smtp.gmail.com`
  * `SMTP_PORT`: `465` (Puerto seguro SSL)
  * `SMTP_SECURE`: `true`
  * `SMTP_USER`: Dirección de correo que enviará las notificaciones.
  * `SMTP_PASS`: Contraseña de aplicación de 16 caracteres de Google.
* **Acceso a Hosting / Despliegue**:
  * Usuario administrador para consola de Vercel.
  * Credenciales del panel de Railway o accesos SSH de la máquina virtual (VPS) del cliente.

> [!WARNING]
> **Recomendación Crítica de Seguridad**: No comparta ni envíe el archivo `.env` por canales no seguros (WhatsApp, email, etc.). Realice una copia física segura del mismo en un gestor de contraseñas empresarial.

---

<!-- PAGE BREAK -->

<div style="page-break-after: always; break-after: page;"></div>

## 📄 HOJA 4: LIQUIDACIÓN DEL PRECIO FINAL, TÉRMINOS DE GARANTÍA Y FIRMAS

### 1. Liquidación del Precio Final

A continuación se detalla la liquidación final por la totalidad del desarrollo, diseño, testing y despliegue del sistema:

* **Concepto 1: Desarrollo del Backend y API Rest** --------------------------- `$ [Insertar Monto]`
* **Concepto 2: Diseño de UX/UI y Frontend React** ------------------------- `$ [Insertar Monto]`
* **Concepto 3: Módulo de Asistencia y Liquidaciones** -------------------- `$ [Insertar Monto]`
* **Concepto 4: Flujo de Seguridad y Recuperación SMTP** ----------------- `$ [Insertar Monto]`
* **Concepto 5: Despliegue, Nginx, SSL y Servidor** -------------------------- `$ [Insertar Monto]`
* **DESCUENTO / ADELANTOS PREVIOS** ---------------------------------------- `- $ [Insertar Monto]`
* **TOTAL LIQUIDADO A ABONAR:** --------------------------------------------- **`$ [Insertar Monto]`**

---

### 2. Términos de Garantía y Soporte Post-Entrega

* **Garantía del Software**: El sistema cuenta con una garantía técnica de **90 días de cobertura** a partir de la firma de este dossier. Cubre la corrección sin cargo de fallas en el código original, errores en lógica financiera y caídas inesperadas del servicio bajo condiciones normales de uso.
* **Exclusiones**: No cubre daños causados por modificaciones no autorizadas en el código, alteraciones de datos mediante comandos SQL externos, o pérdida de llaves criptográficas configuradas en el archivo `.env`.
* **Soporte Mensual (Opcional)**: Tras finalizar la garantía, se ofrece un servicio mensual de mantenimiento técnico preventivo, actualizaciones menores y soporte de emergencia.

---

### 3. Acta de Conformidad y Bloque de Firmas

Al firmar este documento, las partes declaran su total conformidad con las funcionalidades provistas, el estado del código entregado y los términos presupuestarios y de garantía aquí descritos.

`<br><br>``<br>`

```
  📋 FIRMA CLIENTE                              🚀 FIRMA PROVEEDOR
  
  ___________________________                   ___________________________
  Aclaración:                                   Aclaración:
  DNI/CUIT:                                     DNI/CUIT:
  Fecha: ____/____/2026                         Fecha: ____/____/2026
```
