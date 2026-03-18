import { Injectable } from '@nestjs/common';
import { customAlphabet } from 'nanoid';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const DEFAULT_LENGTH = 10;
const MIN_LENGTH = 6;
const MAX_LENGTH = 21;

@Injectable()
export class ShortCodeGeneratorService {
  generateCode(length: number = DEFAULT_LENGTH): string {
    if (length < MIN_LENGTH || length > MAX_LENGTH) {
      throw new Error(
        `O tamanho do short code deve estar entre ${MIN_LENGTH} e ${MAX_LENGTH}`,
      );
    }

    return customAlphabet(ALPHABET, length)();
  }
}