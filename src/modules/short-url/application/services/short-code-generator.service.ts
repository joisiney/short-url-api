import { Injectable } from '@nestjs/common';

const CHARSET =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const DEFAULT_LENGTH = 7;

@Injectable()
export class ShortCodeGeneratorService {
  generate(length: number = DEFAULT_LENGTH): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += CHARSET[Math.floor(Math.random() * CHARSET.length)];
    }
    return result;
  }
}
