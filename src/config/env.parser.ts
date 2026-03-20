import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { EnvVariables, type Env } from './env-variables';
import { collectEnvCrossRuleViolations } from './env-cross-rules';
import { flattenValidationErrors } from '../shared/http/utils/validation-exception.factory';

let cachedEnv: Env | null = null;

function normalizeEnvInput(
  input: Record<string, string | undefined>,
): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = { ...input };

  const applyDefault = (key: string, fallback: string) => {
    const raw = out[key];
    if (raw === undefined || raw === null) {
      out[key] = fallback;
      return;
    }
    if (typeof raw === 'string' && raw.trim() === '') {
      out[key] = fallback;
    }
  };

  applyDefault('APP_HTTP_TIMEOUT_MS', '5000');
  applyDefault('CACHE_TTL_SECONDS', '60');

  return out;
}

export function parseEnv(input: Record<string, string | undefined>): Env {
  if (cachedEnv) {
    return cachedEnv;
  }

  const instance = plainToInstance(EnvVariables, normalizeEnvInput(input), {
    enableImplicitConversion: false,
  });

  const errors = validateSync(instance, {
    forbidUnknownValues: false,
  });

  const crossIssues =
    errors.length === 0 ? collectEnvCrossRuleViolations(instance) : [];

  if (errors.length > 0 || crossIssues.length > 0) {
    const payload: Record<string, unknown> = {};
    if (errors.length > 0) {
      payload.validationErrors = flattenValidationErrors(errors);
    }
    if (crossIssues.length > 0) {
      payload.crossRuleIssues = crossIssues;
    }
    console.error(
      'Configuração de ambiente inválida:',
      JSON.stringify(payload, null, 2),
    );
    throw new Error('Configuração de ambiente inválida');
  }

  cachedEnv = instance;
  return cachedEnv;
}
