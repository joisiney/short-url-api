import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { EnvVariables, type Env } from './env-variables';
import { collectEnvCrossRuleViolations } from './env-cross-rules';
import { flattenValidationErrors } from '../shared/http/utils/validation-exception.factory';

let cachedEnv: Env | null = null;

export function parseEnv(input: Record<string, string | undefined>): Env {
  if (cachedEnv) {
    return cachedEnv;
  }

  const instance = plainToInstance(EnvVariables, input, {
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
