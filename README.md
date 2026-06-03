
# 📋 **Documentación Técnica - Gestor Financiero Automatizado**

**Versión:** 1.0.0  
**Última actualización:** Junio 2026  
**Estado:** Pronto a producción

## 📑 Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Tecnologías Utilizadas](#tecnologías-utilizadas)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Guía de Instalación](#guía-de-instalación)
6. [Configuración de Producción](#configuración-de-producción)
7. [Base de Datos](#base-de-datos)
8. [API REST](#api-rest)
9. [Autenticación y Seguridad](#autenticación-y-seguridad)
10. [Despliegue en Producción](#despliegue-en-producción)
11. [Monitoreo y Mantenimiento](#monitoreo-y-mantenimiento)

---

## 📌 **Descripción General**

**Gestor Financiero Automatizado** es una aplicación web full-stack diseñada para:
- 💰 Gestionar saldos en banco y efectivo
- 📊 Registrar ingresos/egresos diarios
- 👥 Administrar proveedores y pagos
- 📈 Generar reportes financieros
- 👤 Control de roles y permisos de empleados
- ⏰ Registro de asistencia y nómina

---

## 🏗️ **Arquitectura del Sistema**

```
┌─────────────────────────────────────────────┐
│  CLIENTE (Browser - React 19 + Tailwind)    │
└──────────────────┬──────────────────────────┘
                   │ HTTPS
                   ▼
┌─────────────────────────────────────────────┐
│  PROXY INVERSO (Nginx 1.25-alpine)          │
│  - SSL/TLS Termination                      │
│  - Rate Limiting                            │
│  - Compresión GZIP                          │
└──────────────────┬──────────────────────────┘
                   │
    ┌──────────────┼──────────────┐
    ▼              ▼              ▼
┌─────────┐  ┌──────────┐  ┌─────────────┐
│Frontend │  │  API     │  │ PostgreSQL  │
│(Nginx)  │  │(Express) │  │ Database    │
│:80      │  │:3000     │  │ :5432       │
└─────────┘  └──────────┘  └─────────────┘
```

---

## 🛠️ **Tecnologías Utilizadas**

### Backend
- **Node.js** 20+
- **Express** 5.2.1 (Framework web)
- **Prisma** 5.22.0 (ORM)
- **PostgreSQL** 16 (Base de datos)
- **JWT** 9.0.3 (Autenticación)
- **bcrypt** 6.0.0 (Hash de contraseñas)
- **Winston** 3.11.0 (Logging)
- **Helmet** 8.1.0 (Seguridad)

### Frontend
- **React** 19.2.5
- **Vite** 8.0.10 (Bundler)
- **Tailwind CSS** 4.3.0
- **Radix UI** (Componentes accesibles)
- **Axios** 1.16.1 (Cliente HTTP)

### DevOps
- **Docker** 24+
- **Docker Compose** 2.20+
- **Nginx** 1.25-alpine
- **Certbot** (Let's Encrypt)

---

## 📁 **Estructura del Proyecto**

```
ecommerce-project/
├── backend/
│   ├── src/
│   │   ├── server.js              # Servidor
│   │   ├── routes/                # Endpoints
│   │   ├── controllers/           # Lógica
│   │   ├── middleware/            # Middlewares
│   │   ├── services/              # Servicios
│   │   └── validators/            # Esquemas Zod
│   ├── prisma/
│   │   ├── schema.prisma          # Modelo de datos
│   │   └── migrations/            # Migraciones
│   ├── init.sql                   # Triggers SQL
│   ├── Dockerfile                 # Multi-stage
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/                 # Rutas
│   │   ├── components/            # Componentes
│   │   ├── services/              # Cliente API
│   │   └── main.jsx
│   ├── Dockerfile
│   └── package.json
│
├── nginx/
│   ├── nginx.conf
│   └── ssl/                       # Certificados
│
├── docker-compose.yml             # Producción
├── docker-compose.dev.yml         # Desarrollo
├── .env.example
└── DOCUMENTACION_TECNICA.md       # Este archivo
```

---

## 🚀 **Instalación Local (Desarrollo)**

### 1. Clonar el repositorio

```bash
git clone https://github.com/max9lh/ecommerce-project.git
cd ecommerce-project
git checkout documentacion_tecnica
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
nano .env
```

**Variables críticas:**
```env
POSTGRES_DB=gestor_financiero
POSTGRES_USER=gestor_user
POSTGRES_PASSWORD=contraseña_aqui
JWT_SECRET=clave_jwt_aqui
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### 3. Levantar stack

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# En background
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### 4. Verificar servicios

```bash
# API
curl http://localhost:3000/api/health

# Frontend
http://localhost:5173

# Proxy
http://localhost:8080
```

---

## 🔐 **Seguridad Pre-Producción**

### Variables críticas a generar

```bash
# Generar JWT_SECRET (64 caracteres)
openssl rand -base64 64

# Generar POSTGRES_PASSWORD (32 caracteres)
openssl rand -base64 32

# Generar certificados SSL
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ./nginx/ssl/private.key \
  -out ./nginx/ssl/certificate.crt
```

### Variables de .env producción

```env
NODE_ENV=production
POSTGRES_PASSWORD=<generar con openssl>
JWT_SECRET=<generar con openssl>
BCRYPT_ROUNDS=12
CORS_ORIGIN=https://tudominio.com
VITE_API_URL=https://tudominio.com/api
LOG_LEVEL=info
```

---

## 🗄️ **Modelo de Datos (Prisma)**

```prisma
enum Role {
  ADMIN
  EMPLOYEE
}

model User {
  id                 Int      @id @default(autoincrement())
  username           String   @unique
  password_hash      String
  role               Role     @default(EMPLOYEE)
  pct_merchandise    Decimal  @default(0.60)
  pct_fixed_expenses Decimal  @default(0.30)
  pct_savings        Decimal  @default(0.10)
  created_at         DateTime @default(now())
  deleted_at         DateTime?
  
  accounts           Account[]
  expenses           Expense[]
  providers          Provider[]
  employeePermission EmployeePermission?
}

model Account {
  id       Int      @id @default(autoincrement())
  user_id  Int
  name     String   @db.VarChar(20)
  balance  Decimal  @default(0.00)
  user     User     @relation(fields: [user_id])
}

model Provider {
  id                Int      @id @default(autoincrement())
  user_id           Int
  name              String   @db.VarChar(100)
  payment_condition String   // "Contado" | "Crédito"
  credit_days       Int      @default(0)
  user              User     @relation(fields: [user_id])
  expenses          Expense[]
}

model Expense {
  id              Int       @id @default(autoincrement())
  user_id         Int
  provider_id     Int
  account_id      Int
  budget_category String    // "Mercadería", "Gastos Fijos", "Ahorro"
  amount          Decimal
  status          String    @default("Pagado")
  due_date        DateTime?
  created_at      DateTime  @default(now())
  paid_at         DateTime?
}

model EmployeePermission {
  id                  Int      @id @default(autoincrement())
  user_id             Int      @unique
  canRegisterClosures Boolean  @default(false)
  canRegisterExpenses Boolean  @default(false)
  canPayExpenses      Boolean  @default(false)
  canManageProviders  Boolean  @default(false)
  user                User     @relation(fields: [user_id])
}
```

---

## 🔌 **API REST - Endpoints Principales**

### Autenticación

```http
POST /api/auth/login
Content-Type: application/json
{
  "username": "admin",
  "password": "contraseña"
}

Response 200:
{
  "access_token": "eyJhbGci...",
  "refresh_token": "eyJhbGci...",
  "user": { "id": 1, "username": "admin", "role": "ADMIN" }
}
```

### Proveedores

```http
GET    /api/providers              # Listar
POST   /api/providers              # Crear
PUT    /api/providers/:id          # Actualizar
DELETE /api/providers/:id          # Eliminar
```

### Egresos

```http
GET    /api/expenses               # Listar
POST   /api/expenses               # Registrar
PUT    /api/expenses/:id/pay       # Pagar
```

### Cierre Diario

```http
POST   /api/closures               # Realizar cierre
GET    /api/closures               # Listar cierres
```

---

## 🚢 **Despliegue en VPS (DigitalOcean, Linode, AWS)**

### 1. Preparación del servidor

```bash
# Conectarse
ssh root@tu_ip_publica

# Actualizar
apt update && apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Usuario para la aplicación
sudo useradd -m -s /bin/bash gestor
sudo usermod -aG docker gestor
```

### 2. Clonar y configurar

```bash
su - gestor
cd ~
git clone https://github.com/max9lh/ecommerce-project.git app
cd app
cp .env.example .env
# Editar .env con valores de producción
nano .env
```

### 3. Certificados SSL

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Generar certificado
sudo certbot certonly \
  --standalone \
  -d tudominio.com \
  -d www.tudominio.com \
  --email admin@tudominio.com \
  --agree-tos
```

### 4. Firewall

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 5. Levantar aplicación

```bash
cd ~/app
docker compose build
docker compose up -d
docker compose ps
```

### 6. Servicio Systemd (opcional)

```bash
sudo nano /etc/systemd/system/gestor-app.service
```

```ini
[Unit]
Description=Gestor Financiero
After=docker.service
Requires=docker.service

[Service]
User=gestor
WorkingDirectory=/home/gestor/app
ExecStart=/usr/local/bin/docker-compose up
ExecStop=/usr/local/bin/docker-compose down
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable gestor-app.service
sudo systemctl start gestor-app.service
```

---

## 📊 **Monitoreo**

```bash
# Ver status
docker compose ps

# Logs en tiempo real
docker compose logs -f api_service
docker compose logs -f frontend_service

# Estadísticas
docker stats

# Entrar a contenedor
docker exec -it gestor_api bash
docker exec -it gestor_db psql -U gestor_user -d gestor_financiero
```

---

## 💾 **Backups**

```bash
# Crear backup
docker exec gestor_db pg_dump \
  -U gestor_user \
  -d gestor_financiero \
  > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar
docker exec -i gestor_db psql -U gestor_user -d gestor_financiero \
  < backup_20260603_140000.sql
```

## 📞 **Contacto**

**Repositorio**: https://github.com/max9lh/ecommerce-project  
**Rama documentación**: `documentacion_tecnica`

---

**Última actualización:** Junio 2026  
**Versión:** 1.0.0
