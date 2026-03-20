import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateShortUrlRequest } from './create-short-url.request';

function validateBody(input: Record<string, unknown>) {
  const instance = plainToInstance(CreateShortUrlRequest, input);
  return validateSync(instance);
}

describe('CreateShortUrlRequest', () => {
  it('deve_retornar_sucesso_quando_url_valida', () => {
    const errors = validateBody({
      url: 'https://www.example.com/path',
    });

    expect(errors).toHaveLength(0);
  });

  it('deve_retornar_erro_quando_url_invalida', () => {
    const errors = validateBody({
      url: 'not-a-valid-url',
    });

    expect(errors.length).toBeGreaterThan(0);
    const urlError = errors.find((e) => e.property === 'url');
    expect(urlError).toBeDefined();
  });

  it('deve_retornar_erro_quando_input_vazio', () => {
    const errors = validateBody({});

    expect(errors.length).toBeGreaterThan(0);
    const urlError = errors.find((e) => e.property === 'url');
    expect(urlError).toBeDefined();
  });
});
