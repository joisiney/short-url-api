import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { json } from 'express';

import { NestExpressApplication } from '@nestjs/platform-express';
import { AppConfig } from '@config/app.config';
import type { LoggerConfig } from '@config/logger.config';

import { AppExceptionFilter } from '@shared/http/filters/app-exception.filter';
import { validationExceptionFactory } from '@shared/http/utils/validation-exception.factory';
import { RequestContextInterceptor } from '@shared/http/interceptors/request-context.interceptor';
import { LoggingInterceptor } from '@shared/http/interceptors/logging.interceptor';
import { TimeoutInterceptor } from '@shared/http/interceptors/timeout.interceptor';

export async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);
  const appConfig = configService.get<AppConfig>('app');

  if (!appConfig) {
    throw new Error('A configuração do app falhou ao carregar');
  }

  const loggerConfig = configService.get<LoggerConfig>('logger');

  // Global HTTP Shared Base
  app.useGlobalFilters(new AppExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      exceptionFactory: validationExceptionFactory,
    }),
  );
  app.useGlobalInterceptors(
    new RequestContextInterceptor(),
    new LoggingInterceptor(loggerConfig),
    new TimeoutInterceptor(configService),
  );

  // Disable x-powered-by
  app.disable('x-powered-by');

  // Hardening HTTP com Helmet
  app.use(helmet());

  // CORS restritivo por ambiente
  app.enableCors({
    origin: appConfig.corsOrigin,
  });

  // Limite de payload
  app.use(json({ limit: appConfig.bodyLimit }));

  // Global API prefix
  app.setGlobalPrefix(appConfig.globalPrefix);

  app.enableShutdownHooks();

  if (appConfig.enableSwagger) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Short URL API')
      .setDescription(
        'API REST de encurtamento de URLs. Contratos públicos documentados conforme OpenAPI 3.0.',
      )
      .setVersion('1.0.0')
      .addTag('short-url', 'Endpoints da feature de encurtamento de URL')
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
