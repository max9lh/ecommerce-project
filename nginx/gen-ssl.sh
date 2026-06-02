#!/bin/bash
# ============================================================
# Script: Generar certificado SSL autofirmado para desarrollo
# Uso: chmod +x ./nginx/gen-ssl.sh && ./nginx/gen-ssl.sh
# ============================================================

set -e

SSL_DIR="./nginx/ssl"

echo "📁 Creando directorio $SSL_DIR..."
mkdir -p "$SSL_DIR"

echo "🔐 Generando certificado SSL autofirmado (válido por 365 días)..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$SSL_DIR/self-signed.key" \
  -out "$SSL_DIR/self-signed.crt" \
  -subj "/C=AR/ST=Buenos Aires/L=Buenos Aires/O=GestorFinanciero/OU=Dev/CN=localhost"

echo ""
echo "✅ Certificado generado exitosamente:"
echo "   Clave privada : $SSL_DIR/self-signed.key"
echo "   Certificado   : $SSL_DIR/self-signed.crt"
echo ""
echo "⚠️  Este certificado es SOLO para desarrollo local."
echo "   En producción, usar Let's Encrypt (Certbot)."
echo ""
echo "🚀 Ahora puedes levantar los contenedores con:"
echo "   docker compose up --build -d"
