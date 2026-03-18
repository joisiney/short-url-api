export class InvalidShortUrlStateError extends Error {
  constructor(message: string) {
    super(`Estado inválido para Short URL: ${message}`);
    this.name = 'InvalidShortUrlStateError';
  }
}
