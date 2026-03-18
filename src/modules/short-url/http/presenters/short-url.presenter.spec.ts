import { ShortUrlPresenter } from './short-url.presenter';

describe('ShortUrlPresenter', () => {
  const base = {
    id: 'some-uuid',
    url: 'https://example.com',
    shortCode: 'abc123',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-02T00:00:00Z'),
  };

  it('deve mapear Create/Get/Update outputs para ShortUrlResponse com datas em ISO', () => {
    const result = ShortUrlPresenter.toResponse(base);

    expect(result).toMatchObject({
      id: 'some-uuid',
      url: 'https://example.com',
      shortCode: 'abc123',
      createdAt: base.createdAt.toISOString(),
      updatedAt: base.updatedAt.toISOString(),
    });
    expect(result).not.toHaveProperty('accessCount');
  });

  it('deve mapear GetShortUrlStatsOutput para ShortUrlStatsResponse com datas em ISO', () => {
    const statsInput = {
      ...base,
      accessCount: 42,
    };

    const result = ShortUrlPresenter.toStatsResponse(statsInput);

    expect(result).toMatchObject({
      id: 'some-uuid',
      url: 'https://example.com',
      shortCode: 'abc123',
      accessCount: 42,
      createdAt: base.createdAt.toISOString(),
      updatedAt: base.updatedAt.toISOString(),
    });
  });
});
