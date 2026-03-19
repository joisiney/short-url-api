import { IdGeneratorService } from './id-generator.service';

describe('IdGeneratorService', () => {
  const mockIncr = jest.fn();
  const mockSet = jest.fn();

  const mockRedis = {
    incr: mockIncr,
    set: mockSet,
  };

  function makeSut(): IdGeneratorService {
    const redisService = {
      getClient: () => mockRedis,
    } as unknown as import('../../../../infra/redis/redis.service').RedisService;
    return new IdGeneratorService(redisService);
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar ID incrementado', async () => {
    mockSet.mockResolvedValue('OK');
    mockIncr.mockResolvedValue(14_000_001);

    const sut = makeSut();
    const id = await sut.getNextId();

    expect(id).toBe(14_000_001);
    expect(mockSet).toHaveBeenCalledWith('short_url:next_id', 13_999_999, 'NX');
    expect(mockIncr).toHaveBeenCalledWith('short_url:next_id');
  });

  it('deve retornar 14000000 quando INCR retorna 14000000', async () => {
    mockSet.mockResolvedValue('OK');
    mockIncr.mockResolvedValue(14_000_000);

    const sut = makeSut();
    const id = await sut.getNextId();

    expect(id).toBe(14_000_000);
  });
});
