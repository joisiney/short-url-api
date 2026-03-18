import { shortCodeSchema } from './short-code.schema';

describe('shortCodeSchema', () => {
  it('deve aceitar um shortCode válido dentro dos limites e com caracteres permitidos', () => {
    const result = shortCodeSchema.safeParse('AbC123');

    expect(result.success).toBe(true);
    expect(result.data).toBe('AbC123');
  });

  it('deve rejeitar shortCode com menos de 6 caracteres', () => {
    const result = shortCodeSchema.safeParse('abc1');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        'Short code deve ter no mínimo 6 caracteres',
      );
    }
  });

  it('deve rejeitar shortCode com mais de 21 caracteres', () => {
    const longCode = 'a'.repeat(22);
    const result = shortCodeSchema.safeParse(longCode);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        'Short code deve ter no máximo 21 caracteres',
      );
    }
  });

  it('deve rejeitar shortCode com caracteres especiais', () => {
    const result = shortCodeSchema.safeParse('abc123!');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        'Short code deve conter apenas letras e números',
      );
    }
  });
});
