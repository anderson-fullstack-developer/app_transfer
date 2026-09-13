import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';
import { resetDatabase } from './reset-db';

export interface TestApp {
  app: INestApplication;
  prisma: PrismaService;
}

/**
 * Bootstrap identico ao de `main.ts` (prefixo, versionamento, ValidationPipe,
 * cookies) mas sem helmet/CORS/Swagger, que nao influenciam o comportamento
 * testado. O rate limiting desliga-se sozinho em NODE_ENV=test (ver
 * `AppThrottlerGuard`) -- os pedidos de teste partem todos do mesmo IP e
 * excederiam os limites pensados para trafego real sem testar nada de novo.
 */
export async function createTestApp(): Promise<TestApp> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

  const app = moduleRef.createNestApplication();
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  await app.init();

  const prisma = app.get(PrismaService);
  await resetDatabase(prisma);

  return { app, prisma };
}

export async function closeTestApp(testApp: TestApp): Promise<void> {
  await testApp.app.close();
}
