import { registerAs } from '@nestjs/config';
import { parseEnv } from './env.parser';

export type RedisConfig = {
  host: string;
  port: number;
  password?: string;
  db: number;
  tlsEnabled: boolean;
  connectTimeoutMs: number;
};

export default registerAs('redis', (): RedisConfig => {
  const parsedEnv = parseEnv(process.env);
  return {
    host: parsedEnv.REDIS_HOST,
    port: parsedEnv.REDIS_PORT,
    password: parsedEnv.REDIS_PASSWORD,
    db: parsedEnv.REDIS_DB,
    tlsEnabled: parsedEnv.REDIS_TLS_ENABLED,
    connectTimeoutMs: parsedEnv.REDIS_CONNECT_TIMEOUT_MS,
  };
});
