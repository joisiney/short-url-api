import { z } from 'zod';

// ─── Primitivos reutilizáveis ────────────────────────────────────────────────

const booleanString = z
  .enum(['true', 'false'])
  .transform((v) => v === 'true');

const portNumber = z.coerce.number().int().min(1024).max(65535);

const nonEmptyString = z.string().trim().min(1);

const milliseconds = z.coerce
  .number()
  .int()
  .min(0)
  .max(86_400_000, { message: 'Timeout não pode exceder 24 horas (86400000ms)' });

// ─── Schema principal ────────────────────────────────────────────────────────

export const envSchema = z
  .object({
    // ── App ──────────────────────────────────────────────────────────────────
    NODE_ENV: z.enum(['development', 'test', 'production']),

    APP_PORT: portNumber,

    APP_HOST: z
      .string()
      .trim()
      .min(1)
      .refine(
        (v) => v === 'localhost' || /^(\d{1,3}\.){3}\d{1,3}$/.test(v) || /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v),
        { message: 'APP_HOST deve ser localhost, um IP válido ou um hostname válido' },
      ),

    APP_GLOBAL_PREFIX: z
      .string()
      .trim()
      .min(1)
      .regex(/^[a-z0-9-/]+$/, { message: 'APP_GLOBAL_PREFIX deve conter apenas letras minúsculas, números, hífens e barras' })
      .default('api'),

    APP_CORS_ORIGIN: z
      .string()
      .min(1)
      .transform((val) => val.split(',').map((v) => v.trim()))
      .refine(
        (origins) =>
          origins.every(
            (o) => o === '*' || /^https?:\/\/(localhost|\d{1,3}(?:\.\d{1,3}){3}|[a-zA-Z0-9.-]+)(:\d+)?$/.test(o),
          ),
        { message: 'APP_CORS_ORIGIN deve conter origens válidas (ex: http://localhost:3000) ou "*"' },
      ),

    APP_BODY_LIMIT: z
      .string()
      .trim()
      .regex(/^\d+(\.\d+)?(b|kb|mb|gb)$/i, {
        message: 'APP_BODY_LIMIT deve estar no formato: 100b, 1.5kb, 10mb, 1gb',
      })
      .default('100kb'),

    APP_ENABLE_SWAGGER: booleanString,

    // ── Database ─────────────────────────────────────────────────────────────
    DB_HOST: z
      .string()
      .trim()
      .min(1)
      .refine(
        (v) => v === 'localhost' || /^(\d{1,3}\.){3}\d{1,3}$/.test(v) || /^[a-zA-Z0-9.-]+$/.test(v),
        { message: 'DB_HOST deve ser localhost, um IP válido ou um hostname válido' },
      ),

    DB_PORT: portNumber,

    DB_NAME: z
      .string()
      .trim()
      .min(1)
      .max(63, { message: 'DB_NAME não pode exceder 63 caracteres' })
      .regex(/^[a-zA-Z0-9_-]+$/, { message: 'DB_NAME deve conter apenas letras, números, hífens e underscores' }),

    DB_USER: z
      .string()
      .trim()
      .min(1)
      .max(63, { message: 'DB_USER não pode exceder 63 caracteres' })
      .regex(/^[a-zA-Z0-9_-]+$/, { message: 'DB_USER deve conter apenas letras, números, hífens e underscores' }),

    DB_PASSWORD: z
      .string()
      .min(8, { message: 'DB_PASSWORD deve ter no mínimo 8 caracteres' })
      .max(128, { message: 'DB_PASSWORD não pode exceder 128 caracteres' })
      .refine((v) => /[A-Z]/.test(v), { message: 'DB_PASSWORD deve conter ao menos uma letra maiúscula' })
      .refine((v) => /[a-z]/.test(v), { message: 'DB_PASSWORD deve conter ao menos uma letra minúscula' })
      .refine((v) => /\d/.test(v), { message: 'DB_PASSWORD deve conter ao menos um número' })
      .refine((v) => /[^A-Za-z0-9]/.test(v), { message: 'DB_PASSWORD deve conter ao menos um caractere especial' }),

    DB_SSL: booleanString,

    DB_POOL_MIN: z.coerce.number().int().min(0).max(100, { message: 'DB_POOL_MIN não pode exceder 100' }),

    DB_POOL_MAX: z.coerce.number().int().min(1).max(1000, { message: 'DB_POOL_MAX não pode exceder 1000' }),

    DB_IDLE_TIMEOUT_MS: milliseconds,

    DB_CONNECTION_TIMEOUT_MS: milliseconds,

    // ── Redis ─────────────────────────────────────────────────────────────────
    REDIS_HOST: z
      .string()
      .trim()
      .min(1)
      .refine(
        (v) => v === 'localhost' || /^(\d{1,3}\.){3}\d{1,3}$/.test(v) || /^[a-zA-Z0-9.-]+$/.test(v),
        { message: 'REDIS_HOST deve ser localhost, um IP válido ou um hostname válido' },
      ),

    REDIS_PORT: portNumber,

    REDIS_PASSWORD: z
      .string()
      .min(8, { message: 'REDIS_PASSWORD deve ter no mínimo 8 caracteres' })
      .max(128, { message: 'REDIS_PASSWORD não pode exceder 128 caracteres' }),

    REDIS_DB: z.coerce.number().int().min(0).max(15, { message: 'REDIS_DB deve estar entre 0 e 15' }),

    REDIS_TLS_ENABLED: booleanString,

    REDIS_CONNECT_TIMEOUT_MS: milliseconds,

    // ── Logger ────────────────────────────────────────────────────────────────
    LOG_LEVEL: z.enum(['debug', 'log', 'warn', 'error']),

    LOG_PRETTY: booleanString,

    LOG_REDACT_SENSITIVE: booleanString,
  })

  // ── Refinamentos cruzados ──────────────────────────────────────────────────
  .superRefine((data, ctx) => {
    // Pool size
    if (data.DB_POOL_MAX < data.DB_POOL_MIN) {
      ctx.addIssue({
        code: 'custom',
        message: `DB_POOL_MAX (${data.DB_POOL_MAX}) deve ser maior ou igual a DB_POOL_MIN (${data.DB_POOL_MIN})`,
        path: ['DB_POOL_MAX'],
      });
    }

    // Swagger só deve ser habilitado fora de produção
    if (data.APP_ENABLE_SWAGGER && data.NODE_ENV === 'production') {
      ctx.addIssue({
        code: 'custom',
        message: 'APP_ENABLE_SWAGGER não deve ser ativado em produção',
        path: ['APP_ENABLE_SWAGGER'],
      });
    }

    // TLS Redis obrigatório em produção
    if (data.NODE_ENV === 'production' && !data.REDIS_TLS_ENABLED) {
      ctx.addIssue({
        code: 'custom',
        message: 'REDIS_TLS_ENABLED deve ser true em produção',
        path: ['REDIS_TLS_ENABLED'],
      });
    }

    // SSL DB obrigatório em produção
    if (data.NODE_ENV === 'production' && !data.DB_SSL) {
      ctx.addIssue({
        code: 'custom',
        message: 'DB_SSL deve ser true em produção',
        path: ['DB_SSL'],
      });
    }

    // CORS aberto (*) não deve existir em produção
    if (data.NODE_ENV === 'production' && data.APP_CORS_ORIGIN.includes('*')) {
      ctx.addIssue({
        code: 'custom',
        message: 'APP_CORS_ORIGIN não pode ser "*" em produção',
        path: ['APP_CORS_ORIGIN'],
      });
    }

    // LOG_PRETTY deve ser false em produção (logs estruturados)
    if (data.NODE_ENV === 'production' && data.LOG_PRETTY) {
      ctx.addIssue({
        code: 'custom',
        message: 'LOG_PRETTY deve ser false em produção para garantir logs estruturados',
        path: ['LOG_PRETTY'],
      });
    }

    // Connection timeout deve ser menor que idle timeout quando ambos > 0
    if (
      data.DB_CONNECTION_TIMEOUT_MS > 0 &&
      data.DB_IDLE_TIMEOUT_MS > 0 &&
      data.DB_CONNECTION_TIMEOUT_MS >= data.DB_IDLE_TIMEOUT_MS
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'DB_CONNECTION_TIMEOUT_MS deve ser menor que DB_IDLE_TIMEOUT_MS',
        path: ['DB_CONNECTION_TIMEOUT_MS'],
      });
    }
  });

export type Env = z.infer<typeof envSchema>;