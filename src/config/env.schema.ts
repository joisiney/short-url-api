import { z } from 'zod';

// ─── Primitivos reutilizáveis ────────────────────────────────────────────────

const booleanString = z.enum(['true', 'false']).transform((v) => v === 'true');

const portNumber = z.coerce.number().int().min(1024).max(65535);

const milliseconds = z.coerce
  .number()
  .int()
  .min(0)
  .max(86_400_000, { error: 'Timeout não pode exceder 24 horas (86400000ms)' });

// Host aceita localhost, IPv4 ou hostname — z.url() não aceita localhost no v4
const hostSchema = z.union([z.literal('localhost'), z.ipv4(), z.hostname()]);

// ─── Schema principal ────────────────────────────────────────────────────────

export const envSchema = z
  .object({
    // ── App ──────────────────────────────────────────────────────────────────
    NODE_ENV: z.enum(['development', 'test', 'production']),

    APP_PORT: portNumber,

    APP_HOST: hostSchema,

    APP_GLOBAL_PREFIX: z
      .string()
      .trim()
      .min(1)
      .regex(/^[a-z0-9-/]+$/, {
        error:
          'APP_GLOBAL_PREFIX deve conter apenas letras minúsculas, números, hífens e barras',
      })
      .default('api'),

    // Cada origem é uma URL http/https válida ou "*"
    APP_CORS_ORIGIN: z
      .string()
      .min(1)
      .transform((val) => val.split(',').map((v) => v.trim()))
      .refine(
        (origins) =>
          origins.every((o) => o === '*' || z.httpUrl().safeParse(o).success),
        { error: 'APP_CORS_ORIGIN deve conter URLs http/https válidas ou "*"' },
      ),

    APP_BODY_LIMIT: z
      .string()
      .trim()
      .regex(/^\d+(\.\d+)?(b|kb|mb|gb)$/i, {
        error: 'APP_BODY_LIMIT deve estar no formato: 100b, 1.5kb, 10mb, 1gb',
      })
      .default('100kb'),

    APP_HTTP_TIMEOUT_MS: milliseconds.default(5000),

    APP_ENABLE_SWAGGER: booleanString,

    // ── Database ─────────────────────────────────────────────────────────────
    DB_HOST: hostSchema,

    DB_PORT: portNumber,

    DB_NAME: z
      .string()
      .trim()
      .min(1)
      .max(63, { error: 'DB_NAME não pode exceder 63 caracteres' })
      .regex(/^[a-zA-Z0-9_-]+$/, {
        error:
          'DB_NAME deve conter apenas letras, números, hífens e underscores',
      }),

    DB_USER: z
      .string()
      .trim()
      .min(1)
      .max(63, { error: 'DB_USER não pode exceder 63 caracteres' })
      .regex(/^[a-zA-Z0-9_-]+$/, {
        error:
          'DB_USER deve conter apenas letras, números, hífens e underscores',
      }),

    DB_PASSWORD: z
      .string()
      .min(8, { error: 'DB_PASSWORD deve ter no mínimo 8 caracteres' })
      .max(128, { error: 'DB_PASSWORD não pode exceder 128 caracteres' })
      .refine((v) => /[A-Z]/.test(v), {
        error: 'DB_PASSWORD deve conter ao menos uma letra maiúscula',
      })
      .refine((v) => /[a-z]/.test(v), {
        error: 'DB_PASSWORD deve conter ao menos uma letra minúscula',
      })
      .refine((v) => /\d/.test(v), {
        error: 'DB_PASSWORD deve conter ao menos um número',
      })
      .refine((v) => /[^A-Za-z0-9]/.test(v), {
        error: 'DB_PASSWORD deve conter ao menos um caractere especial',
      }),

    DB_SSL: booleanString,

    DB_POOL_MIN: z.coerce.number().int().min(0).max(100),
    DB_POOL_MAX: z.coerce.number().int().min(1).max(1000),

    DB_IDLE_TIMEOUT_MS: milliseconds,
    DB_CONNECTION_TIMEOUT_MS: milliseconds,

    // ── Redis ─────────────────────────────────────────────────────────────────
    REDIS_HOST: hostSchema,

    REDIS_PORT: portNumber,

    REDIS_PASSWORD: z
      .string()
      .min(8, { error: 'REDIS_PASSWORD deve ter no mínimo 8 caracteres' })
      .max(128, { error: 'REDIS_PASSWORD não pode exceder 128 caracteres' }),

    REDIS_DB: z.coerce
      .number()
      .int()
      .min(0)
      .max(15, { error: 'REDIS_DB deve estar entre 0 e 15' }),

    REDIS_TLS_ENABLED: booleanString,
    REDIS_CONNECT_TIMEOUT_MS: milliseconds,

    CACHE_TTL_SECONDS: z.coerce
      .number()
      .int()
      .min(1)
      .max(86400)
      .optional()
      .default(60),

    // ── Logger ────────────────────────────────────────────────────────────────
    LOG_LEVEL: z.enum(['debug', 'log', 'warn', 'error']),
    LOG_PRETTY: booleanString,
    LOG_REDACT_SENSITIVE: booleanString,

    // ── OpenTelemetry (opcional) ──────────────────────────────────────────────
    OTEL_SERVICE_NAME: z
      .string()
      .optional()
      .transform((v) => (v && v.trim() !== '' ? v.trim() : undefined)),
    OTEL_EXPORTER_OTLP_ENDPOINT: z
      .union([z.url(), z.literal('')])
      .optional()
      .transform((v) => (v === '' ? undefined : v)),
    OTEL_TRACES_EXPORTER: z.enum(['otlp', 'none']).optional(),
  })

  // ── Refinamentos cruzados ──────────────────────────────────────────────────
  .superRefine((data, ctx) => {
    if (data.DB_POOL_MAX < data.DB_POOL_MIN) {
      ctx.addIssue({
        code: 'custom',
        message: `DB_POOL_MAX (${data.DB_POOL_MAX}) deve ser >= DB_POOL_MIN (${data.DB_POOL_MIN})`,
        path: ['DB_POOL_MAX'],
      });
    }

    if (data.NODE_ENV === 'production') {
      if (data.APP_ENABLE_SWAGGER)
        ctx.addIssue({
          code: 'custom',
          message: 'APP_ENABLE_SWAGGER não deve ser ativado em produção',
          path: ['APP_ENABLE_SWAGGER'],
        });

      if (!data.REDIS_TLS_ENABLED)
        ctx.addIssue({
          code: 'custom',
          message: 'REDIS_TLS_ENABLED deve ser true em produção',
          path: ['REDIS_TLS_ENABLED'],
        });

      if (!data.DB_SSL)
        ctx.addIssue({
          code: 'custom',
          message: 'DB_SSL deve ser true em produção',
          path: ['DB_SSL'],
        });

      if (data.APP_CORS_ORIGIN.includes('*'))
        ctx.addIssue({
          code: 'custom',
          message: 'APP_CORS_ORIGIN não pode ser "*" em produção',
          path: ['APP_CORS_ORIGIN'],
        });

      if (data.LOG_PRETTY)
        ctx.addIssue({
          code: 'custom',
          message: 'LOG_PRETTY deve ser false em produção',
          path: ['LOG_PRETTY'],
        });
    }

    if (
      data.DB_CONNECTION_TIMEOUT_MS > 0 &&
      data.DB_IDLE_TIMEOUT_MS > 0 &&
      data.DB_CONNECTION_TIMEOUT_MS >= data.DB_IDLE_TIMEOUT_MS
    ) {
      ctx.addIssue({
        code: 'custom',
        message:
          'DB_CONNECTION_TIMEOUT_MS deve ser menor que DB_IDLE_TIMEOUT_MS',
        path: ['DB_CONNECTION_TIMEOUT_MS'],
      });
    }
  });

export type Env = z.infer<typeof envSchema>;
