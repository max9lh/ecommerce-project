# DOCUMENTACIÓN TÉCNICA - PROYECTO ECOMMERCE

**Versión:** 1.0  
**Fecha:** Junio 2026  
**Rama:** token_refresh  
**Proyecto:** Página de Ecommerce

---

## 📋 TABLA DE CONTENIDOS

1. [Descripción General](#descripción-general)
2. [Requisitos Funcionales](#requisitos-funcionales)
3. [Requisitos No Funcionales](#requisitos-no-funcionales)
4. [Arquitectura del Sistema](#arquitectura-del-sistema)
5. [Stack Tecnológico](#stack-tecnológico)
6. [Autenticación y Autorización](#autenticación-y-autorización)
7. [Módulos Principales](#módulos-principales)
8. [Guía de Instalación](#guía-de-instalación)
9. [Guía de Uso](#guía-de-uso)
10. [Consideraciones de Seguridad](#consideraciones-de-seguridad)

---

## 🎯 DESCRIPCIÓN GENERAL

Este documento técnico detalla la arquitectura, características y requisitos del proyecto de Ecommerce. El sistema está diseñado para proporcionar una plataforma de comercio electrónico robusta, escalable y segura que permita a usuarios realizar compras, gestionar cuentas y acceder a información de productos.

**Versión de la rama:** token_refresh - Incluye mejoras en la autenticación con tokens JWT y refresh tokens.

---

## 📌 REQUISITOS FUNCIONALES

### RF-001: Autenticación de Usuarios
- **Descripción:** El sistema debe permitir que los usuarios se registren, inicien sesión y cierren sesión de forma segura.
- **Criterios de Aceptación:**
  - Los usuarios pueden registrarse con email y contraseña
  - El sistema valida la unicidad del email
  - Las contraseñas se almacenan de forma segura (hasheadas)
  - Los usuarios pueden recuperar contraseña olvidada

### RF-002: Gestión de Tokens JWT
- **Descripción:** El sistema debe implementar autenticación basada en tokens JWT con refresh token.
- **Criterios de Aceptación:**
  - Los tokens JWT se generan al login con expiración configurable
  - Los refresh tokens permiten obtener nuevos JWT sin re-autenticarse
  - Los tokens expirados son rechazados
  - Hay un mecanismo para revocar tokens

### RF-003: Catálogo de Productos
- **Descripción:** El sistema debe mostrar un catálogo de productos con filtros y búsqueda.
- **Criterios de Aceptación:**
  - Se pueden visualizar productos con imagen, nombre, descripción y precio
  - Se pueden filtrar por categoría, precio y disponibilidad
  - Función de búsqueda por nombre o descripción
  - Paginación de resultados

### RF-004: Carrito de Compras
- **Descripción:** Los usuarios pueden agregar/remover productos del carrito.
- **Criterios de Aceptación:**
  - Agregar y remover productos del carrito
  - Actualizar cantidades
  - Calcular total automáticamente
  - Persistencia del carrito (sesión o BD)

### RF-005: Proceso de Checkout
- **Descripción:** El sistema debe permitir completar el proceso de compra.
- **Criterios de Aceptación:**
  - Validación de información de envío
  - Selección de método de pago
  - Confirmación de orden
  - Generación de número de orden único

### RF-006: Gestión de Órdenes
- **Descripción:** Los usuarios pueden ver el historial y estado de sus órdenes.
- **Criterios de Aceptación:**
  - Visualizar órdenes anteriores
  - Ver estado de la orden (pendiente, procesando, enviada, entregada)
  - Cancelar órdenes en ciertos estados
  - Rastrear envío

### RF-007: Perfil de Usuario
- **Descripción:** Los usuarios pueden gestionar su información personal.
- **Criterios de Aceptación:**
  - Editar nombre, email, teléfono
  - Cambiar contraseña
  - Gestionar direcciones de envío
  - Ver historial de compras

### RF-008: Panel de Administración
- **Descripción:** Los administradores pueden gestionar productos y órdenes.
- **Criterios de Aceptación:**
  - Crear, editar y eliminar productos
  - Ver y gestionar órdenes
  - Generar reportes de ventas
  - Auditoría de cambios

---

## 🔒 REQUISITOS NO FUNCIONALES

### RNF-001: Seguridad
- **Descripción:** El sistema debe implementar medidas de seguridad robustas.
- **Detalles:**
  - Validación de entrada en todas las peticiones
  - Protección contra SQL Injection
  - Protección contra XSS (Cross-Site Scripting)
  - HTTPS obligatorio en producción
  - Tokens JWT con firma y verificación
  - Rate limiting en endpoints sensibles
  - Logs de auditoría de cambios críticos

### RNF-002: Performance
- **Descripción:** El sistema debe tener tiempos de respuesta óptimos.
- **Detalles:**
  - Tiempo de respuesta API < 500ms en promedio
  - Caché de productos frecuentemente consultados
  - Compresión de respuestas (gzip)
  - CDN para activos estáticos
  - Índices en base de datos para consultas frecuentes
  - Lazy loading de imágenes

### RNF-003: Escalabilidad
- **Descripción:** El sistema debe poder escalar horizontalmente.
- **Detalles:**
  - Arquitectura de microservicios (opcional)
  - Base de datos relacional normalizada
  - Session storage distribuido
  - Balanceo de carga
  - Posibilidad de múltiples instancias del servidor

### RNF-004: Disponibilidad
- **Descripción:** El sistema debe estar disponible la mayoría del tiempo.
- **Detalles:**
  - SLA objetivo: 99.5% de uptime
  - Mantenimiento con downtime mínimo
  - Respaldos automáticos de base de datos
  - Recuperación ante fallos

### RNF-005: Compatibilidad
- **Descripción:** El sistema debe funcionar en múltiples navegadores y dispositivos.
- **Detalles:**
  - Responsive design (mobile, tablet, desktop)
  - Compatibilidad con navegadores modernos
  - Soporte para JavaScript deshabilitado (fallback)
  - API-first (permite múltiples clientes)

### RNF-006: Mantenibilidad
- **Descripción:** El código debe ser fácil de mantener y extender.
- **Detalles:**
  - Código bien estructurado y documentado
  - Pruebas unitarias e integración
  - Versionado semántico
  - Guías de contribución
  - Documentación actualizada

### RNF-007: Cumplimiento Legal
- **Descripción:** El sistema debe cumplir con regulaciones aplicables.
- **Detalles:**
  - GDPR compliance (datos personales)
  - Política de privacidad visible
  - Consentimiento de cookies
  - Términos de servicio
  - Protección de datos sensibles

---

## 🏗️ ARQUITECTURA DEL SISTEMA

### Diagrama de Capas

```
┌─────────────────────────────────────────────────┐
│           CAPA DE PRESENTACIÓN                  │
│  (Frontend - React/Next.js, HTML, CSS, JS)      │
└─────────────────────────────────────────────────┘
                      ↕ API REST
┌─────────────────────────────────────────────────┐
│    CAPA DE APLICACIÓN / SERVICIOS                │
│  (Express.js, Controllers, Services, Utils)     │
└─────────────────────────────────────────────────┘
                      ↕ ORM/Query Builder
┌─────────────────────────────────────────────────┐
│    CAPA DE PERSISTENCIA / BASE DE DATOS          │
│  (Prisma, PostgreSQL/MySQL, Caché Redis)        │
└─────────────────────────────────────────────────┘
```

### Componentes Principales

1. **Frontend:** Interfaz de usuario responsiva
2. **Backend API:** Servidor Express.js con endpoints REST
3. **Base de Datos:** PostgreSQL/MySQL con Prisma ORM
4. **Autenticación:** JWT con refresh tokens
5. **Almacenamiento:** Imágenes y assets en servidor o CDN

---

## 🛠️ STACK TECNOLÓGICO

### Frontend
- **Framework:** React / Next.js
- **Lenguaje:** JavaScript / TypeScript
- **Estilos:** CSS / TailwindCSS / Bootstrap
- **Gestión de Estado:** Redux / Zustand / Context API
- **HTTP Client:** Axios / Fetch API
- **Validación:** Zod / Yup

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Lenguaje:** JavaScript / TypeScript
- **ORM:** Prisma
- **Base de Datos:** PostgreSQL / MySQL
- **Autenticación:** JWT (jsonwebtoken)
- **Logging:** Winston / Morgan
- **Validación:** Express Validator / Joi

### DevOps & Deployment
- **Control de Versiones:** Git / GitHub
- **CI/CD:** GitHub Actions
- **Hosting:** Vercel (Frontend) / Heroku / Railway (Backend)
- **Containerización:** Docker (opcional)
- **Variables de Entorno:** .env files

### Testing
- **Unit Testing:** Jest / Vitest
- **Integration Testing:** Supertest
- **E2E Testing:** Cypress / Playwright

---

## 🔐 AUTENTICACIÓN Y AUTORIZACIÓN

### Flujo de Autenticación

```
1. Usuario ingresa credenciales
   ↓
2. Sistema valida credenciales en BD
   ↓
3. Se generan tokens:
   - Access Token (JWT, expira en 15-60 minutos)
   - Refresh Token (almacenado en BD, válido 7-30 días)
   ↓
4. Tokens se envían al cliente
   ↓
5. Cliente usa Access Token en cada petición (header Authorization)
```

### Endpoint de Refresh Token

```
POST /api/auth/refresh
Body: { refreshToken: "token_string" }
Response: { accessToken: "new_jwt", refreshToken: "new_refresh_token" }
```

### Middleware de Autenticación

```javascript
// Verifica que el token sea válido
// Extrae información del usuario
// Permite continuar si es válido, rechaza si está expirado
```

### Roles y Permisos

- **USER:** Cliente estándar (compras, perfil)
- **ADMIN:** Administrador (gestión de productos, órdenes, usuarios)
- **MODERATOR:** Moderador (soporte, gestión de contenido)

---

## 📦 MÓDULOS PRINCIPALES

### 1. Módulo de Autenticación
- Registro de usuarios
- Login con JWT
- Logout
- Refresh de tokens
- Cambio de contraseña
- Recuperación de contraseña

### 2. Módulo de Productos
- Listar productos con filtros
- Ver detalles del producto
- Búsqueda y filtrado
- Gestión de categorías (admin)
- Gestión de inventario

### 3. Módulo de Carrito
- Agregar/remover items
- Actualizar cantidad
- Calcular total
- Aplicar cupones de descuento

### 4. Módulo de Órdenes
- Crear orden desde carrito
- Validar información de envío
- Seleccionar método de pago
- Ver historial de órdenes
- Rastrear estado

### 5. Módulo de Usuario
- Ver perfil
- Editar información personal
- Gestionar direcciones
- Ver preferencias
- Auditoría de actividad

### 6. Módulo de Administración
- Dashboard de estadísticas
- Gestión de productos
- Gestión de órdenes
- Gestión de usuarios
- Reportes
- Auditoría de cambios

---

## 🚀 GUÍA DE INSTALACIÓN

### Requisitos Previos
- Node.js v16+
- npm o yarn
- PostgreSQL/MySQL
- Git

### Pasos de Instalación

#### 1. Clonar el repositorio
```bash
git clone https://github.com/max9lh/ecommerce-project.git
cd ecommerce-project
```

#### 2. Cambiar a la rama token_refresh
```bash
git checkout token_refresh
```

#### 3. Instalar dependencias del backend
```bash
cd backend
npm install
```

#### 4. Instalar dependencias del frontend
```bash
cd ../frontend
npm install
```

#### 5. Configurar variables de entorno

**Backend (.env)**
```
DATABASE_URL=postgresql://user:password@localhost:5432/ecommerce
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=3600
REFRESH_TOKEN_EXPIRES_IN=604800
NODE_ENV=development
PORT=3001
```

**Frontend (.env.local)**
```
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_ENV=development
```

#### 6. Ejecutar migraciones de BD
```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

#### 7. Iniciar el proyecto

**Backend**
```bash
npm run dev
```

**Frontend** (en otra terminal)
```bash
npm run dev
```

---

## 📖 GUÍA DE USO

### Para Usuarios Finales

1. **Registro:** Acceder a la página de registro, ingresar email y contraseña
2. **Compra:** Buscar productos, agregar al carrito, proceder al checkout
3. **Seguimiento:** Ver órdenes en el perfil
4. **Perfil:** Editar información personal y direcciones

### Para Administradores

1. **Acceso:** Usar cuenta de admin para login
2. **Dashboard:** Ver estadísticas de ventas y órdenes
3. **Gestión:** Crear/editar/eliminar productos
4. **Reportes:** Generar reportes de ventas

### Endpoints Principales

**Autenticación**
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/refresh` - Refrescar token
- `POST /api/auth/logout` - Cerrar sesión

**Productos**
- `GET /api/products` - Listar productos
- `GET /api/products/:id` - Obtener producto
- `POST /api/products` - Crear producto (admin)

**Órdenes**
- `GET /api/orders` - Listar mis órdenes
- `POST /api/orders` - Crear orden
- `GET /api/orders/:id` - Obtener detalles de orden

**Usuario**
- `GET /api/users/profile` - Obtener perfil
- `PUT /api/users/profile` - Actualizar perfil
- `PUT /api/users/password` - Cambiar contraseña

---

## 🛡️ CONSIDERACIONES DE SEGURIDAD

### 1. Almacenamiento de Contraseñas
- ✅ Usar bcrypt o argon2 para hashear contraseñas
- ✅ Usar salt aleatorio
- ✅ Nunca almacenar contraseñas en texto plano

### 2. Gestión de Tokens
- ✅ Access tokens con corta expiración (15-60 minutos)
- ✅ Refresh tokens almacenados en BD
- ✅ Tokens firmados con SECRET_KEY
- ✅ Revocar tokens al logout

### 3. Validación de Entrada
- ✅ Validar todos los inputs del usuario
- ✅ Sanitizar inputs para prevenir XSS
- ✅ Usar parameterized queries para prevenir SQL Injection
- ✅ Validar tipos de datos

### 4. HTTPS
- ✅ Usar HTTPS en producción (obligatorio)
- ✅ Certificados SSL/TLS válidos
- ✅ Headers de seguridad (HSTS, CSP, etc.)

### 5. Rate Limiting
- ✅ Limitar intentos de login
- ✅ Limitar creación de cuentas
- ✅ Limitar llamadas a API por usuario/IP

### 6. Logging y Monitoreo
- ✅ Registrar accesos críticos
- ✅ Monitorear anomalías
- ✅ Alertas de seguridad
- ✅ No registrar contraseñas o tokens sensibles

### 7. Control de Acceso
- ✅ Verificar permisos en cada endpoint
- ✅ No confiar en datos del cliente (IDs)
- ✅ Implementar RBAC (Role-Based Access Control)
- ✅ Auditoría de acciones administrativas

---

## 📞 SOPORTE Y CONTACTO

Para preguntas o problemas técnicos:
- 📧 Email: maxalvarez@fi.uba.ar
- 🔗 GitHub: https://github.com/max9lh/ecommerce-project
- 📋 Issues: https://github.com/max9lh/ecommerce-project/issues

---

## 📄 LICENCIA

Este proyecto está licenciado bajo MIT License.

---

**Documento Generado:** 2 de Junio, 2026  
**Responsable:** Equipo de Desarrollo  
**Versión:** 1.0
