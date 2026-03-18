import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { ShortUrlModule } from '../modules/short-url/short-url.module';

@Module({
  imports: [ConfigModule, ShortUrlModule],
})
export class AppModule {}
