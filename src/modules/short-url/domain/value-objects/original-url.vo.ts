export class OriginalUrl {
  private readonly value: string;

  constructor(value: string) {
    try {
      new URL(value);
    } catch {
      throw new Error('Formato de URL inválido');
    }
    this.value = value;
  }

  getValue(): string {
    return this.value;
  }
}
