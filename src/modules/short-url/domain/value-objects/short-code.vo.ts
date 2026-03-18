export class ShortCode {
  private readonly value: string;

  constructor(value: string) {
    if (!value || value.length < 3 || value.length > 10) {
      throw new Error('O formato do short code é inválido');
    }
    this.value = value;
  }

  getValue(): string {
    return this.value;
  }
}
