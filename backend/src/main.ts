import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // CORS — supports comma-separated origins, vercel domains, and localhost
  const origins = (process.env.FRONTEND_URL ?? 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || origins.includes(origin) || origin.endsWith('.vercel.app') || origin.includes('localhost')) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation — strips unknown fields, transforms types
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global exception filter — handles Prisma + HTTP errors uniformly
  app.useGlobalFilters(new GlobalExceptionFilter());

  app.setGlobalPrefix('api');
  app.enableShutdownHooks();

  const port = parseInt(process.env.PORT ?? '4000', 10);
  await app.listen(port);
  logger.log(`Backend running on http://localhost:${port}/api`);
}

void bootstrap();
