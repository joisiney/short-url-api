import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from '../../infra/database/database.service';

@Controller('health')
export class HealthController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get('live')
  getLiveness() {
    return { status: 'ok' };
  }

  @Get('ready')
  async getReadiness() {
    const dbHealthy = await this.databaseService.isHealthy();

    const allHealthy = dbHealthy;

    return {
      status: allHealthy ? 'ok' : 'degraded',
      dependencies: {
        database: dbHealthy ? 'up' : 'down',
      },
    };
  }

  @Get()
  async getHealth() {
    const dbHealthy = await this.databaseService.isHealthy();

    return {
      status: dbHealthy ? 'ok' : 'degraded',
      summary: {
        database: dbHealthy ? 'up' : 'down',
      },
    };
  }
}
