import { registerAs } from '@nestjs/config';
import { parseEnv } from './env.parser';

export type DbConfig = {
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
  ssl: boolean;
  poolMin: number;
  poolMax: number;
  idleTimeoutMs: number;
  connectionTimeoutMs: number;
};

export default registerAs('db', (): DbConfig => {
  const parsedEnv = parseEnv(process.env);
  return {
    host: parsedEnv.PG_HOST,
    port: parsedEnv.PG_PORT,
    name: parsedEnv.PG_NAME,
    user: parsedEnv.PG_USER,
    password: parsedEnv.PG_PWD,
    ssl: parsedEnv.PG_SSL,
    poolMin: parsedEnv.PG_POOL_MIN,
    poolMax: parsedEnv.PG_POOL_MAX,
    idleTimeoutMs: parsedEnv.PG_IDLE_TIMEOUT_MS,
    connectionTimeoutMs: parsedEnv.PG_CONNECTION_TIMEOUT_MS,
  };
});
