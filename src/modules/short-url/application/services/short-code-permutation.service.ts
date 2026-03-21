import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'node:crypto';

import type { Env } from '@config/env-variables';

const UINT32_MAX = 0xffff_ffff;
const FEISTEL_ROUNDS = 8;

@Injectable()
export class ShortCodePermutationService {
  private readonly secret: string;

  constructor(private readonly configService: ConfigService<Env, true>) {
    this.secret = this.configService.get('SHORT_CODE_FEISTEL_SECRET', {
      infer: true,
    });
  }

  /**
   * Permutação keyed (Feistel 32 bits) sobre o contador; bijeção em uint32.
   */
  permute(id: number): number {
    if (!Number.isInteger(id) || id < 0 || id > UINT32_MAX) {
      throw new Error('O ID deve ser um inteiro entre 0 e 4294967295 (uint32)');
    }
    let L = (id >>> 16) & 0xffff;
    let R = id & 0xffff;
    for (let round = 0; round < FEISTEL_ROUNDS; round++) {
      const f = this.roundFunction(R, round);
      const nextL = R;
      const nextR = (L ^ f) & 0xffff;
      L = nextL;
      R = nextR;
    }
    return ((L << 16) | R) >>> 0;
  }

  private roundFunction(rHalf: number, round: number): number {
    const h = createHmac('sha256', this.secret);
    const roundBuf = Buffer.allocUnsafe(4);
    roundBuf.writeUInt32BE(round >>> 0, 0);
    h.update(roundBuf);
    const rBuf = Buffer.allocUnsafe(2);
    rBuf.writeUInt16BE(rHalf & 0xffff, 0);
    h.update(rBuf);
    return h.digest().readUInt16BE(0);
  }
}
