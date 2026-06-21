/**
 * src/main.ts
 * Bootstrap aplikasi: prefix versi, validasi global, CORS, security headers, Swagger.
 */
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import type { AppConfig } from './common/config/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  const config = app.get(ConfigService);
  const appCfg = config.getOrThrow<AppConfig>('app');

  // Versi di path: /v1/...
  app.setGlobalPrefix(appCfg.apiPrefix);

  // Validasi & whitelist body (cegah mass assignment).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableCors({
    origin: appCfg.corsOrigins.length ? appCfg.corsOrigins : false,
    credentials: true,
  });

  if (appCfg.nodeEnv !== 'production') {
    const swaggerCfg = new DocumentBuilder()
      .setTitle('CMS Core API')
      .setDescription('Headless Media Publishing REST API')
      .setVersion('1.0')
      .addBearerAuth()
      .addApiKey({ type: 'apiKey', name: 'X-API-Key', in: 'header' }, 'api-key')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerCfg);
    SwaggerModule.setup('docs', app, document);
  }

  await app.listen(appCfg.port, '0.0.0.0');

  console.log(`CMS Core API berjalan di port ${appCfg.port} (prefix /${appCfg.apiPrefix})`);
}

void bootstrap();
