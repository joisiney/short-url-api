import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { flattenValidationErrors } from '@shared/validation/flatten-validation-errors';
import { PgConnectionEnv } from './pg-connection-env';

export function parsePgConnectionEnv(
  input: Record<string, string | undefined>,
  contextLabel: string,
): PgConnectionEnv {
  const instance = plainToInstance(PgConnectionEnv, input, {
    enableImplicitConversion: false,
  });
  const errors = validateSync(instance, { forbidUnknownValues: false });
  if (errors.length > 0) {
    const details = flattenValidationErrors(errors);
    const lines = details.map((d) => `  ${d.field}: ${d.message}`);
    throw new Error(
      `${contextLabel} Configuração PostgreSQL inválida:\n${lines.join('\n')}`,
    );
  }
  return instance;
}
