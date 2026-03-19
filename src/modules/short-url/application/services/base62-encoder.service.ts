import { Injectable } from '@nestjs/common';

const ALPHABET =
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const BASE = 62;

@Injectable()
export class Base62EncoderService {
  encode(id: number): string {
    if (id < 0 || !Number.isInteger(id)) {
      throw new Error('O ID deve ser um inteiro nao negativo');
    }

    if (id === 0) return ALPHABET[0]!;

    let n = id;
    let result = '';

    while (n > 0) {
      result = ALPHABET[n % BASE] + result;
      n = Math.floor(n / BASE);
    }

    return result;
  }
}
