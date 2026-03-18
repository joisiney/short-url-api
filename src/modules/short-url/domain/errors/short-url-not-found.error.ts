export class ShortUrlNotFoundError extends Error {
  constructor(shortCode: string) {
    super(`Short URL com código "${shortCode}" não encontrada.`);
    this.name = 'ShortUrlNotFoundError';
  }
}
