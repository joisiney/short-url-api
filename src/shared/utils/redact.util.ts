const REDACTED = '[REDACTED]';
const QUERY_MASK = '?***';

/**
 * Mascara a query string de um path para evitar vazamento de tokens/parâmetros sensíveis em logs.
 */
export function redactPath(path: string): string {
  const idx = path.indexOf('?');
  if (idx === -1) return path;
  return path.slice(0, idx) + QUERY_MASK;
}

/**
 * Aplica redação em campos sensíveis de um payload de log quando redactSensitive está ativo.
 */
export function redactForLog<T extends Record<string, unknown>>(
  payload: T,
  redactSensitive: boolean,
): T {
  if (!redactSensitive) return payload;

  const result = { ...payload } as Record<string, unknown>;

  if (typeof result.path === 'string') {
    result.path = redactPath(result.path);
  }

  if (result.details !== undefined) {
    result.details = REDACTED;
  }

  return result as T;
}
