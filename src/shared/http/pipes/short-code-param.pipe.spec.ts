import { BadRequestException } from '@nestjs/common';
import { ShortCodeParamPipe } from './short-code-param.pipe';

describe('ShortCodeParamPipe', () => {
  const pipe = new ShortCodeParamPipe();

  it('deve aceitar um shortCode valido dentro dos limites e com caracteres permitidos', () => {
    expect(pipe.transform('WK2s')).toBe('WK2s');
  });

  it('deve rejeitar shortCode com menos de 4 caracteres', () => {
    expect(() => pipe.transform('ab1')).toThrow(BadRequestException);
    try {
      pipe.transform('ab1');
    } catch (e) {
      const res = (e as BadRequestException).getResponse() as {
        details: Array<{ message: string }>;
      };
      expect(res.details[0]?.message).toBe(
        'Short code deve ter no minimo 4 caracteres',
      );
    }
  });

  it('deve aceitar shortCode com 8 caracteres', () => {
    expect(pipe.transform('abcdef12')).toBe('abcdef12');
  });

  it('deve rejeitar shortCode com mais de 8 caracteres', () => {
    const longCode = 'a'.repeat(9);
    expect(() => pipe.transform(longCode)).toThrow(BadRequestException);
    try {
      pipe.transform(longCode);
    } catch (e) {
      const res = (e as BadRequestException).getResponse() as {
        details: Array<{ message: string }>;
      };
      expect(res.details[0]?.message).toBe(
        'Short code deve ter no maximo 8 caracteres',
      );
    }
  });

  it('deve rejeitar shortCode com caracteres especiais', () => {
    expect(() => pipe.transform('abc123!')).toThrow(BadRequestException);
    try {
      pipe.transform('abc123!');
    } catch (e) {
      const res = (e as BadRequestException).getResponse() as {
        details: Array<{ message: string }>;
      };
      expect(res.details[0]?.message).toBe(
        'Short code deve conter apenas letras e numeros',
      );
    }
  });
});
