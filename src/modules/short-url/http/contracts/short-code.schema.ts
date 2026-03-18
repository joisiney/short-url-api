import { z } from 'zod';

/**
 * Shared validation schema for shortCode parameter across HTTP border.
 * Follows the rules defined in ShortCodeGeneratorService (ALPHABET, MIN/MAX length).
 */
export const shortCodeSchema = z
  .string({
    message: 'Short code deve ser uma string',
  })
  .min(6, { message: 'Short code deve ter no mínimo 6 caracteres' })
  .max(21, { message: 'Short code deve ter no máximo 21 caracteres' })
  .regex(/^[a-zA-Z0-9]+$/, {
    message: 'Short code deve conter apenas letras e números',
  });

export type ShortCodeParamDto = z.infer<typeof shortCodeSchema>;
