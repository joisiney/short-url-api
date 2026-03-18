export class ShortCodeConflictError extends Error {
  constructor(shortCode: string) {
    super(`O short code "${shortCode}" já existe.`);
    this.name = 'ShortCodeConflictError';
  }
}
