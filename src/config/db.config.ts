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
    host: parsedEnv.DB_HOST,
    port: parsedEnv.DB_PORT,
    name: parsedEnv.DB_NAME,
    user: parsedEnv.DB_USER,
    password: parsedEnv.DB_PASSWORD,
    ssl: parsedEnv.DB_SSL,
    poolMin: parsedEnv.DB_POOL_MIN,
    poolMax: parsedEnv.DB_POOL_MAX,
    idleTimeoutMs: parsedEnv.DB_IDLE_TIMEOUT_MS,
    connectionTimeoutMs: parsedEnv.DB_CONNECTION_TIMEOUT_MS,
  };
});
