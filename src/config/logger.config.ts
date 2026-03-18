import { registerAs } from '@nestjs/config';
import { parseEnv } from './env.parser';

export type LoggerConfig = {
  level: string;
  pretty: boolean;
  redactSensitive: boolean;
};

export default registerAs('logger', (): LoggerConfig => {
  const parsedEnv = parseEnv(process.env);
  return {
    level: parsedEnv.LOG_LEVEL,
    pretty: parsedEnv.LOG_PRETTY,
    redactSensitive: parsedEnv.LOG_REDACT_SENSITIVE,
  };
});
