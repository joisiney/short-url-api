import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as shortUrlsSchema from './schema/short-urls.table';
import type { Env } from '../../config/env-variables';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  public readonly db: NodePgDatabase<typeof shortUrlsSchema>;
  private readonly pool: Pool;

  constructor(private configService: ConfigService<Env, true>) {
    const dbHost = this.configService.get('DB_HOST', { infer: true });
    const dbPort = this.configService.get('DB_PORT', { infer: true });
    const dbUser = this.configService.get('DB_USER', { infer: true });
    const dbPassword = this.configService.get('DB_PASSWORD', { infer: true });
    const dbName = this.configService.get('DB_NAME', { infer: true });
    const dbSsl = this.configService.get('DB_SSL', { infer: true });
    const poolMin = this.configService.get('DB_POOL_MIN', { infer: true });
    const poolMax = this.configService.get('DB_POOL_MAX', { infer: true });
    const connectionTimeoutMillis = this.configService.get(
      'DB_CONNECTION_TIMEOUT_MS',
      { infer: true },
    );
    const idleTimeoutMillis = this.configService.get('DB_IDLE_TIMEOUT_MS', {
      infer: true,
    });

    this.pool = new Pool({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
      database: dbName,
      ssl: dbSsl ? { rejectUnauthorized: false } : undefined,
      min: poolMin,
      max: poolMax,
      connectionTimeoutMillis,
      idleTimeoutMillis,
    });

    this.db = drizzle({ client: this.pool, schema: shortUrlsSchema });
  }

  async onModuleInit() {
    this.logger.log('Conectando ao banco de dados...');
    try {
      const client = await this.pool.connect();
      client.release();
      this.logger.log('Conexão ao banco de dados estabelecida com sucesso');
    } catch (error) {
      this.logger.error('Falha ao conectar ao banco de dados', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    this.logger.log('Encerrando pool de conexões do banco...');
    await this.pool.end();
  }

  async isHealthy(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      client.release();
      return true;
    } catch (error) {
      this.logger.warn('Health check do banco falhou', error as Error);
      return false;
    }
  }
}
