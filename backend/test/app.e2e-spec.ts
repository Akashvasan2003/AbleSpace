import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api returns hello', () => {
    return request(app.getHttpServer() as Parameters<typeof request>[0])
      .get('/api')
      .expect(200)
      .expect('Hello World!');
  });

  it('POST /api/auth/register returns 400 on missing fields', () => {
    return request(app.getHttpServer() as Parameters<typeof request>[0])
      .post('/api/auth/register')
      .send({})
      .expect(400);
  });

  it('POST /api/auth/login returns 400 on missing fields', () => {
    return request(app.getHttpServer() as Parameters<typeof request>[0])
      .post('/api/auth/login')
      .send({})
      .expect(400);
  });

  it('GET /api/auth/me returns 401 without token', () => {
    return request(app.getHttpServer() as Parameters<typeof request>[0])
      .get('/api/auth/me')
      .expect(401);
  });

  it('GET /api/workspaces returns 401 without token', () => {
    return request(app.getHttpServer() as Parameters<typeof request>[0])
      .get('/api/workspaces')
      .expect(401);
  });

  it('GET /api/tasks returns 401 without token', () => {
    return request(app.getHttpServer() as Parameters<typeof request>[0])
      .get('/api/tasks')
      .expect(401);
  });
});
