import { registerAs } from '@nestjs/config';
import { parseEnv } from './env.parser';

export type AppConfig = {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  host: string;
  globalPrefix: string;
  corsOrigin: string[];
  bodyLimit: string;
  enableSwagger: boolean;
};

export default registerAs('app', (): AppConfig => {
  const parsedEnv = parseEnv(process.env);
  return {
    nodeEnv: parsedEnv.NODE_ENV,
    port: parsedEnv.APP_PORT,
    host: parsedEnv.APP_HOST,
    globalPrefix: parsedEnv.APP_GLOBAL_PREFIX,
    corsOrigin: parsedEnv.APP_CORS_ORIGIN,
    bodyLimit: parsedEnv.APP_BODY_LIMIT,
    enableSwagger: parsedEnv.APP_ENABLE_SWAGGER,
  };
});
