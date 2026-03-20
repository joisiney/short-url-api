import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { UpdateShortUrlRequest } from './update-short-url.request';

function validateBody(input: Record<string, unknown>) {
  const instance = plainToInstance(UpdateShortUrlRequest, input);
  return validateSync(instance);
}

describe('UpdateShortUrlRequest', () => {
  it('deve aceitar um payload válido com URL bem formada', () => {
    const errors = validateBody({
      url: 'https://www.example.com/new',
    });

    expect(errors).toHaveLength(0);
  });

  it('deve rejeitar quando a URL é inválida', () => {
    const errors = validateBody({
      url: 'invalid-url',
    });

    expect(errors.length).toBeGreaterThan(0);
    const urlError = errors.find((e) => e.property === 'url');
    const messages = urlError?.constraints
      ? Object.values(urlError.constraints)
      : [];
    expect(messages).toContain('O formato da URL é inválido');
  });

  it('deve rejeitar quando o campo url está ausente', () => {
    const errors = validateBody({});

    expect(errors.length).toBeGreaterThan(0);
    const urlError = errors.find((e) => e.property === 'url');
    expect(urlError).toBeDefined();
  });
});
