import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

import { ZodValidationPipe } from './zod-validation.pipe';

describe('ZodValidationPipe', () => {
  it('deve retornar os dados parseados quando a validação for bem-sucedida', () => {
    const schema = z.object({
      foo: z.string(),
    });
    const pipe = new ZodValidationPipe(schema);

    const result = pipe.transform({ foo: 'bar' }, {} as never);

    expect(result).toEqual({ foo: 'bar' });
  });

  it('deve lançar BadRequestException com código e detalhes quando a validação falhar', () => {
    const schema = z.object({
      foo: z.string(),
    });
    const pipe = new ZodValidationPipe(schema);

    try {
      pipe.transform({ foo: 123 }, {} as never);
      fail('Esperava lançar BadRequestException');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      const response = (error as BadRequestException).getResponse() as {
        code: string;
        message: string;
        details: Array<{ field: string; message: string }>;
      };

      expect(response.code).toBe('VALIDATION_ERROR');
      expect(response.message).toBe('Request validation failed');
      const firstDetail = response.details[0];
      expect(firstDetail?.field).toBe('foo');
      expect(typeof firstDetail?.message).toBe('string');
    }
  });
});

