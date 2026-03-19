import { Test, TestingModule } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json } from 'express';
import helmet from 'helmet';
import request from 'supertest';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from '../src/app/app.module';
import { AppExceptionFilter } from '../src/shared/http/filters/app-exception.filter';
import { RequestContextInterceptor } from '../src/shared/http/interceptors/request-context.interceptor';
import { LoggingInterceptor } from '../src/shared/http/interceptors/logging.interceptor';
import { TimeoutInterceptor } from '../src/shared/http/interceptors/timeout.interceptor';
import { ConfigService } from '@nestjs/config';
import { createTestDb } from './helpers/db-test.helper';

describe('API HTTP (e2e)', () => {
  let app: NestExpressApplication;
  let testDb: ReturnType<typeof createTestDb>;
  const prefix = '/api';

  beforeAll(async () => {
    testDb = createTestDb();
    await testDb.runMigrations();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    const configService = app.get(ConfigService);

    app.useGlobalFilters(new AppExceptionFilter());
    app.useGlobalInterceptors(
      new RequestContextInterceptor(),
      new LoggingInterceptor(),
      new TimeoutInterceptor(configService),
    );
    app.disable('x-powered-by');
    app.use(helmet());
    app.enableCors({ origin: '*' });
    app.use(json({ limit: '100kb' }));
    app.setGlobalPrefix(prefix);

    const swaggerConfig = new DocumentBuilder()
      .setTitle('Short URL API')
      .setVersion('1.0.0')
      .addTag('short-url')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${prefix}/docs`, app, document);

    await app.init();
  });

  beforeEach(async () => {
    await testDb.truncateShortUrls();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    await testDb.close();
  });

  describe('POST /shorten', () => {
    it('deve criar short URL com sucesso', async () => {
      const res = await request(app.getHttpServer())
        .post(`${prefix}/shorten`)
        .send({ url: 'https://example.com' })
        .expect(201);

      expect(res.body).toMatchObject({
        url: 'https://example.com',
      });
      expect(res.body.id).toBeDefined();
      expect(res.body.shortCode).toBeDefined();
      expect(res.body.createdAt).toBeDefined();
      expect(res.body.updatedAt).toBeDefined();
    });

    it('deve retornar 400 quando payload invalido', async () => {
      const res = await request(app.getHttpServer())
        .post(`${prefix}/shorten`)
        .send({ url: 'not-a-url' })
        .expect(400);

      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBeDefined();
      expect(res.body.error.message).toBeDefined();
    });

    it('deve retornar mesmo shortCode ao reenviar mesma URL (idempotente)', async () => {
      const url = 'https://idempotent-test.com';
      const res1 = await request(app.getHttpServer())
        .post(`${prefix}/shorten`)
        .send({ url })
        .expect(201);

      const res2 = await request(app.getHttpServer())
        .post(`${prefix}/shorten`)
        .send({ url })
        .expect(201);

      expect(res1.body.shortCode).toBe(res2.body.shortCode);
      expect(res1.body.url).toBe(url);
      expect(res2.body.url).toBe(url);
    });
  });

  describe('GET /shorten/:shortCode', () => {
    it('deve retornar short URL com sucesso', async () => {
      const createRes = await request(app.getHttpServer())
        .post(`${prefix}/shorten`)
        .send({ url: 'https://example.com' })
        .expect(201);

      const shortCode = createRes.body.shortCode;

      const res = await request(app.getHttpServer())
        .get(`${prefix}/shorten/${shortCode}`)
        .expect(200);

      expect(res.body).toMatchObject({
        url: 'https://example.com',
        shortCode,
      });
    });

    it('deve retornar 404 quando shortCode nao existe', async () => {
      const res = await request(app.getHttpServer())
        .get(`${prefix}/shorten/n0p3`)
        .expect(404);

      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('SHORT_URL_NOT_FOUND');
    });
  });

  describe('PUT /shorten/:shortCode', () => {
    it('deve atualizar URL com sucesso', async () => {
      const createRes = await request(app.getHttpServer())
        .post(`${prefix}/shorten`)
        .send({ url: 'https://example.com' })
        .expect(201);

      const shortCode = createRes.body.shortCode;

      const res = await request(app.getHttpServer())
        .put(`${prefix}/shorten/${shortCode}`)
        .send({ url: 'https://updated.com' })
        .expect(200);

      expect(res.body).toMatchObject({
        url: 'https://updated.com',
        shortCode,
      });
    });

    it('deve retornar 404 quando shortCode nao existe', async () => {
      const res = await request(app.getHttpServer())
        .put(`${prefix}/shorten/n0p3`)
        .send({ url: 'https://any.com' })
        .expect(404);

      expect(res.body.error.code).toBe('SHORT_URL_NOT_FOUND');
    });
  });

  describe('DELETE /shorten/:shortCode', () => {
    it('deve retornar 204 ao deletar com sucesso', async () => {
      const createRes = await request(app.getHttpServer())
        .post(`${prefix}/shorten`)
        .send({ url: 'https://example.com' })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`${prefix}/shorten/${createRes.body.shortCode}`)
        .expect(204);
    });

    it('deve retornar 404 quando shortCode nao existe', async () => {
      await request(app.getHttpServer())
        .delete(`${prefix}/shorten/n0p3`)
        .expect(404);
    });
  });

  describe('Security Input Guard (XSS)', () => {
    it('deve rejeitar body com payload XSS (script tag)', async () => {
      const res = await request(app.getHttpServer())
        .post(`${prefix}/shorten`)
        .send({ url: 'https://example.com/<script>alert(1)</script>' })
        .expect(400);

      expect(res.body.error.code).toBe('SECURITY_INPUT_REJECTED');
      expect(res.body.error.details).toBeDefined();
      expect(res.body.error.details[0].reason).toBe('script_tag_detected');
    });

    it('deve rejeitar body com javascript: protocol', async () => {
      const res = await request(app.getHttpServer())
        .post(`${prefix}/shorten`)
        .send({ url: 'javascript:alert(1)' })
        .expect(400);

      expect(res.body.error.code).toBe('SECURITY_INPUT_REJECTED');
    });

    it('deve aceitar payload limpo', async () => {
      await request(app.getHttpServer())
        .post(`${prefix}/shorten`)
        .send({ url: 'https://example.com/path?foo=bar' })
        .expect(201);
    });
  });

  describe('Correlação (observabilidade)', () => {
    it('deve retornar X-Request-Id em toda resposta', async () => {
      const res = await request(app.getHttpServer())
        .post(`${prefix}/shorten`)
        .send({ url: 'https://example.com' })
        .expect(201);

      expect(res.headers['x-request-id']).toBeDefined();
      expect(res.headers['x-request-id']).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it('deve retornar X-Trace-Id quando traceparent é enviado', async () => {
      const traceId = '4bf92f3577b34da6a3ce929d0e0e4736';
      const spanId = '00f067aa0ba902b7';
      const traceparent = `00-${traceId}-${spanId}-01`;

      const res = await request(app.getHttpServer())
        .get(`${prefix}/shorten/n0p3`)
        .set('traceparent', traceparent)
        .expect(404);

      expect(res.headers['x-request-id']).toBeDefined();
      expect(res.headers['x-trace-id']).toBe(traceId);
    });
  });

  describe('Swagger/OpenAPI', () => {
    it('deve expor documentacao com endpoints da feature short-url', async () => {
      const res = await request(app.getHttpServer())
        .get(`${prefix}/docs-json`)
        .expect(200);

      const paths = res.body.paths as Record<string, unknown>;
      expect(paths['/api/shorten']).toBeDefined();
      expect(paths['/api/shorten/{shortCode}']).toBeDefined();
      expect(paths['/api/shorten/{shortCode}/stats']).toBeDefined();

      expect(res.body.info?.version).toBe('1.0.0');
      expect(res.body.tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'short-url' }),
        ]),
      );
    });
  });

  describe('GET /shorten/:shortCode/stats', () => {
    it('deve retornar estatisticas com sucesso', async () => {
      const createRes = await request(app.getHttpServer())
        .post(`${prefix}/shorten`)
        .send({ url: 'https://example.com' })
        .expect(201);

      const shortCode = createRes.body.shortCode;

      await request(app.getHttpServer()).get(`${prefix}/shorten/${shortCode}`);

      const res = await request(app.getHttpServer())
        .get(`${prefix}/shorten/${shortCode}/stats`)
        .expect(200);

      expect(res.body).toMatchObject({
        shortCode,
        accessCount: 1,
      });
    });

    it('deve retornar 404 quando shortCode nao existe', async () => {
      const res = await request(app.getHttpServer())
        .get(`${prefix}/shorten/n0p3/stats`)
        .expect(404);

      expect(res.body.error.code).toBe('SHORT_URL_NOT_FOUND');
    });
  });
});
