import { shortCodeSchema } from './short-code.schema';

describe('shortCodeSchema', () => {
  it('deve aceitar um shortCode valido dentro dos limites e com caracteres permitidos', () => {
    const result = shortCodeSchema.safeParse('WK2s');

    expect(result.success).toBe(true);
    expect(result.data).toBe('WK2s');
  });

  it('deve rejeitar shortCode com menos de 4 caracteres', () => {
    const result = shortCodeSchema.safeParse('ab1');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        'Short code deve ter no minimo 4 caracteres',
      );
    }
  });

  it('deve rejeitar shortCode com mais de 7 caracteres', () => {
    const longCode = 'a'.repeat(8);
    const result = shortCodeSchema.safeParse(longCode);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        'Short code deve ter no maximo 7 caracteres',
      );
    }
  });

  it('deve rejeitar shortCode com caracteres especiais', () => {
    const result = shortCodeSchema.safeParse('abc123!');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        'Short code deve conter apenas letras e numeros',
      );
    }
  });
});
