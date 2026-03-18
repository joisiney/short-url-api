import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { NestExpressApplication } from '@nestjs/platform-express';
import { AppConfig } from '../config/app.config';

export async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);
  const appConfig = configService.get<AppConfig>('app');

  if (!appConfig) {
    throw new Error('A configuração do app falhou ao carregar');
  }

  // Disable x-powered-by
  app.disable('x-powered-by');

  // Global API prefix
  app.setGlobalPrefix(appConfig.globalPrefix);

  app.enableShutdownHooks();

  if (appConfig.enableSwagger) {
    // Swagger setup
    const swaggerConfig = new DocumentBuilder()
      .setTitle('API de encurtamento de URL')
      .setDescription('Documentação da API de encurtamento de URL')
      .setVersion('1.0')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${appConfig.globalPrefix}/docs`, app, document);
  }

  await app.listen(appConfig.port, appConfig.host);

  Logger.log(
    `Aplicação está sendo executada em: http://${appConfig.host}:${appConfig.port}/${appConfig.globalPrefix}`,
    'Bootstrap',
  );
}

bootstrap().catch((err) => {
  Logger.error('Erro ao iniciar a aplicação', err, 'Bootstrap');
  process.exit(1);
});
