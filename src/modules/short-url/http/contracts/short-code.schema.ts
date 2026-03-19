import { z } from 'zod';

/**
 * Shared validation schema for shortCode parameter across HTTP border.
 * Base 62: 4-8 caracteres (ID inicial 14M = 4 chars, capacidade ate 62^8).
 */
export const shortCodeSchema = z
  .string({
    message: 'Short code deve ser uma string',
  })
  .min(4, { message: 'Short code deve ter no minimo 4 caracteres' })
  .max(8, { message: 'Short code deve ter no maximo 8 caracteres' })
  .regex(/^[a-zA-Z0-9]+$/, {
    message: 'Short code deve conter apenas letras e numeros',
  });

export type ShortCodeParamDto = z.infer<typeof shortCodeSchema>;
