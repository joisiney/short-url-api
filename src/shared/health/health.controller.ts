import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from '../../infra/database/database.service';
import { RedisService } from '../../infra/redis/redis.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly redisService: RedisService,
  ) {}

  @Get('live')
  getLiveness() {
    return { status: 'ok' };
  }

  @Get('ready')
  async getReadiness() {
    const [dbHealthy, redisHealthy] = await Promise.all([
      this.databaseService.isHealthy(),
      this.redisService.ping(),
    ]);

    const allHealthy = dbHealthy && redisHealthy;

    return {
      status: allHealthy ? 'ok' : 'degraded',
      dependencies: {
        database: dbHealthy ? 'up' : 'down',
        redis: redisHealthy ? 'up' : 'down',
      },
    };
  }

  @Get()
  async getHealth() {
    const [dbHealthy, redisHealthy] = await Promise.all([
      this.databaseService.isHealthy(),
      this.redisService.ping(),
    ]);

    return {
      status: dbHealthy && redisHealthy ? 'ok' : 'degraded',
      summary: {
        database: dbHealthy ? 'up' : 'down',
        redis: redisHealthy ? 'up' : 'down',
      },
    };
  }
}
