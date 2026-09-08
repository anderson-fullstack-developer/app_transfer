import 'reflect-metadata';
import { loadEnv } from './config/load-env';

loadEnv();

import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app-config.service';
import { requestIdMiddleware } from './common/http/request-id.middleware';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  const config = app.get(AppConfigService);
  const logger = new Logger('Bootstrap');

  // --- Seguranca (seccao 23) ---------------------------------------------
  app.use(helmet());
  app.use(cookieParser());
  app.use(requestIdMiddleware);
  app.enableCors({
    origin: config.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // --- API versionada: /api/v1/... (seccao 14) -------------------------
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // --- Validacao global de input --------------------------------------
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  app.enableShutdownHooks();

  // --- Swagger / OpenAPI ---------------------------------------------------
  const swaggerConfig = new DocumentBuilder()
    .setTitle('app-transfer API')
    .setDescription('API da plataforma de envio de apoio financeiro (modo SIMULATION).')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig), {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(config.port);
  logger.log(
    `API a correr em http://localhost:${config.port}/api/v1 (modo ${config.raw.APP_MODE})`,
  );
  logger.log(`Swagger em http://localhost:${config.port}/docs`);
}

void bootstrap();
