import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import appConfig from './app.config';
import dbConfig from './db.config';
import redisConfig from './redis.config';
import loggerConfig from './logger.config';
import { parseEnv } from './env.parser';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      validate: parseEnv,
      load: [appConfig, dbConfig, redisConfig, loggerConfig],
    }),
  ],
  exports: [NestConfigModule],
})
export class ConfigModule {}
