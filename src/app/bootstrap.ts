import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { NestExpressApplication } from '@nestjs/platform-express';

export async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Disable x-powered-by
  app.disable('x-powered-by');

  // Global API prefix
  app.setGlobalPrefix('api');

  app.enableShutdownHooks();

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') || 3000;

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Short URL API')
    .setDescription('The Short URL API documentation')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);

  Logger.log(
    `Application is running on: http://localhost:${port}`,
    'Bootstrap',
  );
}

bootstrap().catch((err) => {
  Logger.error('Error bootstrapping application', err, 'Bootstrap');
  process.exit(1);
});
