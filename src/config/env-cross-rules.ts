import type { EnvVariables } from './env-variables';

export type EnvCrossRuleIssue = { path: string; message: string };

export function collectEnvCrossRuleViolations(
  env: EnvVariables,
): EnvCrossRuleIssue[] {
  const issues: EnvCrossRuleIssue[] = [];

  if (env.PG_POOL_MAX < env.PG_POOL_MIN) {
    issues.push({
      path: 'PG_POOL_MAX',
      message: `PG_POOL_MAX (${env.PG_POOL_MAX}) deve ser >= PG_POOL_MIN (${env.PG_POOL_MIN})`,
    });
  }

  if (env.NODE_ENV === 'production') {
    if (env.APP_ENABLE_SWAGGER) {
      issues.push({
        path: 'APP_ENABLE_SWAGGER',
        message: 'APP_ENABLE_SWAGGER não deve ser ativado em produção',
      });
    }
    if (!env.REDIS_TLS_ENABLED) {
      issues.push({
        path: 'REDIS_TLS_ENABLED',
        message: 'REDIS_TLS_ENABLED deve ser true em produção',
      });
    }
    if (!env.PG_SSL) {
      issues.push({
        path: 'PG_SSL',
        message: 'PG_SSL deve ser true em produção',
      });
    }
    if (env.APP_CORS_ORIGIN.includes('*')) {
      issues.push({
        path: 'APP_CORS_ORIGIN',
        message: 'APP_CORS_ORIGIN não pode ser "*" em produção',
      });
    }
    if (env.LOG_PRETTY) {
      issues.push({
        path: 'LOG_PRETTY',
        message: 'LOG_PRETTY deve ser false em produção',
      });
    }
  }

  if (
    env.PG_CONNECTION_TIMEOUT_MS > 0 &&
    env.PG_IDLE_TIMEOUT_MS > 0 &&
    env.PG_CONNECTION_TIMEOUT_MS >= env.PG_IDLE_TIMEOUT_MS
  ) {
    issues.push({
      path: 'PG_CONNECTION_TIMEOUT_MS',
      message: 'PG_CONNECTION_TIMEOUT_MS deve ser menor que PG_IDLE_TIMEOUT_MS',
    });
  }

  return issues;
}
