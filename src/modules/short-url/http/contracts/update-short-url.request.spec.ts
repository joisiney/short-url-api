import { updateShortUrlSchema } from './update-short-url.request';

describe('updateShortUrlSchema', () => {
  it('deve aceitar um payload válido com URL bem formada', () => {
    const result = updateShortUrlSchema.safeParse({
      url: 'https://www.example.com/new',
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      url: 'https://www.example.com/new',
    });
  });

  it('deve rejeitar quando a URL é inválida', () => {
    const result = updateShortUrlSchema.safeParse({
      url: 'invalid-url',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        'O formato da URL é inválido',
      );
      expect(result.error.issues[0]?.path).toEqual(['url']);
    }
  });

  it('deve rejeitar quando o campo url está ausente', () => {
    const result = updateShortUrlSchema.safeParse({});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['url']);
    }
  });
});

