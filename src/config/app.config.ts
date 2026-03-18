import { registerAs } from '@nestjs/config';
import { envSchema } from './env.schema';

export default registerAs('app', () => {
  const parsed = envSchema.parse(process.env);
  return {
    nodeEnv: parsed.NODE_ENV,
    port: parsed.PORT,
  };
});
