import { Base62EncoderService } from './base62-encoder.service';

describe('Base62EncoderService', () => {
  let service: Base62EncoderService;

  beforeEach(() => {
    service = new Base62EncoderService();
  });

  it('deve codificar 0 como "0"', () => {
    expect(service.encode(0)).toBe('0');
  });

  it('deve codificar 14_000_000 como "WK2s"', () => {
    expect(service.encode(14_000_000)).toBe('WK2s');
  });

  it('deve codificar 62 como "10"', () => {
    expect(service.encode(62)).toBe('10');
  });

  it('deve codificar 61 como "Z"', () => {
    expect(service.encode(61)).toBe('Z');
  });

  it('deve codificar 3844 como "100"', () => {
    expect(service.encode(3844)).toBe('100');
  });

  it('deve lancar erro para ID negativo', () => {
    expect(() => service.encode(-1)).toThrow('O ID deve ser um inteiro nao negativo');
  });

  it('deve lancar erro para ID nao inteiro', () => {
    expect(() => service.encode(1.5)).toThrow('O ID deve ser um inteiro nao negativo');
  });
});
