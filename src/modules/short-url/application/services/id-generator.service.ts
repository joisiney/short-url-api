import { Injectable } from '@nestjs/common';
import { RedisService } from '@infra/redis/redis.service';

const REDIS_KEY = 'short_url:next_id';
const INITIAL_ID = 14_000_000;

@Injectable()
export class IdGeneratorService {
  constructor(private readonly redis: RedisService) {}

  async getNextId(): Promise<number> {
    const client = this.redis.getClient();
    await client.set(REDIS_KEY, INITIAL_ID - 1, 'NX');
    const id = await client.incr(REDIS_KEY);
    return id;
  }
}
