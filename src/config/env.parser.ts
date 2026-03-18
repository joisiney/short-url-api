import z from 'zod';
import { Env, envSchema } from './env.schema';

let cachedEnv: Env | null = null;

export function parseEnv(input: Record<string, string | undefined>): Env {
  if (cachedEnv) {
    return cachedEnv;
  }
  const result = envSchema.safeParse(input);

  if (!result.success) {
    console.error(
      '❌ Configuração de ambiente inválida:',
      JSON.stringify(z.treeifyError(result.error), null, 2),
    );
    throw new Error('Configuração de ambiente inválida');
  }

  cachedEnv = result.data;
  return cachedEnv;
}
