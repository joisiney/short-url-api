import { createShortUrlSchema } from './create-short-url.request';

describe('createShortUrlSchema', () => {
  it('deve_retornar_sucesso_quando_url_valida', () => {
    const result = createShortUrlSchema.safeParse({
      url: 'https://www.example.com/path',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveProperty('url');
      expect(typeof result.data.url).toBe('string');
    }
  });

  it('deve_retornar_erro_quando_url_invalida', () => {
    const result = createShortUrlSchema.safeParse({
      url: 'not-a-valid-url',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      expect(firstIssue?.path).toEqual(['url']);
      expect(typeof firstIssue?.message).toBe('string');
    }
  });

  it('deve_retornar_erro_quando_input_vazio', () => {
    const result = createShortUrlSchema.safeParse({});

    expect(result.success).toBe(false);
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      expect(firstIssue?.path).toEqual(['url']);
      expect(typeof firstIssue?.message).toBe('string');
    }
  });
});

