import { ShortCodePermutationService } from './short-code-permutation.service';
import type { ConfigService } from '@nestjs/config';
import type { Env } from '@config/env-variables';

const TEST_SECRET =
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

function makeConfigService(): ConfigService<Env, true> {
  return {
    get: jest.fn((key: keyof Env) => {
      if (key === 'SHORT_CODE_FEISTEL_SECRET') {
        return TEST_SECRET;
      }
      return undefined;
    }),
  } as unknown as ConfigService<Env, true>;
}

describe('ShortCodePermutationService', () => {
  let service: ShortCodePermutationService;

  beforeEach(() => {
    service = new ShortCodePermutationService(makeConfigService());
  });

  it('deve ser deterministica para o mesmo id', () => {
    const a = service.permute(14_000_001);
    const b = service.permute(14_000_001);
    expect(a).toBe(b);
  });

  it('deve mapear 0..9999 sem colisoes (bijeção amostral)', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 10_000; i++) {
      const p = service.permute(i);
      expect(seen.has(p)).toBe(false);
      seen.add(p);
    }
    expect(seen.size).toBe(10_000);
  });

  it('deve lancar para id negativo', () => {
    expect(() => service.permute(-1)).toThrow(
      'O ID deve ser um inteiro entre 0 e 4294967295 (uint32)',
    );
  });

  it('deve lancar para id maior que uint32', () => {
    expect(() => service.permute(4_294_967_296)).toThrow(
      'O ID deve ser um inteiro entre 0 e 4294967295 (uint32)',
    );
  });

  it('deve produzir vetor conhecido para id 14_000_001 e segredo de teste', () => {
    expect(service.permute(14_000_001)).toBe(1_426_375_419);
  });
});
