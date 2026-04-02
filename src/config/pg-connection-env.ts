import type { PoolConfig } from 'pg';
import { PgConnectionEnvDto } from './pg-connection-env.dto';

export class PgConnectionEnv extends PgConnectionEnvDto {
  toDatabaseUrl(): string {
    const { PG_USER, PG_PWD, PG_HOST, PG_PORT, PG_NAME, PG_SSL } = this;
    const sslQuery = PG_SSL ? '?sslmode=require' : '';
    return `postgresql://${PG_USER}:${PG_PWD}@${PG_HOST}:${PG_PORT}/${PG_NAME}${sslQuery}`;
  }

  toPgPoolConfig(): PoolConfig {
    return {
      host: this.PG_HOST,
      port: this.PG_PORT,
      user: this.PG_USER,
      password: this.PG_PWD,
      database: this.PG_NAME,
      ssl: this.PG_SSL,
    };
  }
}
