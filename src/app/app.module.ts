import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { ShortUrlModule } from '../modules/short-url/short-url.module';
import { DatabaseModule } from '../infra/database/database.module';

@Module({
  imports: [ConfigModule, DatabaseModule, ShortUrlModule],
})
export class AppModule {}
