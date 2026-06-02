// backend/src/config/validate-env.js
const { z } = require('zod');

/**
 * Esquema de validación para variables de entorno.
 * Se ejecuta al iniciar la aplicación.
 */
const envSchema = z.object({
    // ---- NODE ----
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(3000),

    // ---- BASE DE DATOS ----
    DATABASE_URL: z.string().url('DATABASE_URL debe ser una URL válida'),

    // ---- JWT ----
    JWT_SECRET: z.string()
        .min(32, 'JWT_SECRET debe tener al menos 32 caracteres')
        .describe('Generar con: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'),
    JWT_EXPIRES_IN: z.string().default('7d'),

    // ---- BCRYPT ----
    BCRYPT_ROUNDS: z.coerce.number().min(10).max(14).default(12),

    // ---- CORS ----
    CORS_ORIGIN: z.string()
        .url('CORS_ORIGIN debe ser una URL válida')
        .default('http://localhost:5173')
        .describe('En dev: http://localhost:5173, en prod: https://tu-dominio.com'),

    // ---- LOGGING ----
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
});

/**
 * Valida y parsea las variables de entorno.
 * @throws {Error} Si hay variables inválidas o faltantes
 */
function validateEnv() {
    try {
        const env = envSchema.parse(process.env);
        console.log('✅ Variables de entorno validadas correctamente');
        return env;
    } catch (error) {
        console.error('❌ Error en variables de entorno:');
        if (error.issues) {
            error.issues.forEach(issue => {
                console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
            });
        }
        process.exit(1);
    }
}

module.exports = validateEnv;