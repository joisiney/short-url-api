export class ShortCodeGenerationExhaustedError extends Error {
  constructor(maxAttempts: number) {
    super(
      `Não foi possível gerar um short code único após ${maxAttempts} tentativas.`,
    );
    this.name = 'ShortCodeGenerationExhaustedError';
  }
}
