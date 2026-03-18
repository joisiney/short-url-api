import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { json } from 'express';

import { NestExpressApplication } from '@nestjs/platform-express';
import { AppConfig } from '../config/app.config';

import { AppExceptionFilter } from '../shared/http/filters/app-exception.filter';
import { RequestContextInterceptor } from '../shared/http/interceptors/request-context.interceptor';
import { LoggingInterceptor } from '../shared/http/interceptors/logging.interceptor';
import { TimeoutInterceptor } from '../shared/http/interceptors/timeout.interceptor';

export async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);
  const appConfig = configService.get<AppConfig>('app');

  if (!appConfig) {
    throw new Error('A configuração do app falhou ao carregar');
  }

  // Global HTTP Shared Base (ADR-00-04, ADR-00-09)
  app.useGlobalFilters(new AppExceptionFilter());
  app.useGlobalInterceptors(
    new RequestContextInterceptor(),
    new LoggingInterceptor(),
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
