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
import { validationExceptionFactory } from './common/validation/validation-exception.factory';

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
      // Pesan error per-field (code VALIDATION_ERROR + details) agar UI bisa
      // menandai field yang gagal, bukan sekadar 400 generik.
      exceptionFactory: validationExceptionFactory,
    }),
  );

  app.enableCors({
    origin: appCfg.corsOrigins.length ? appCfg.corsOrigins : false,
    credentials: true,
  });

  if (appCfg.nodeEnv !== 'production') {
    const swaggerCfg = new DocumentBuilder()
      .setTitle('CMS Core API')
      .setDescription(
        [
          'Headless Media Publishing REST API.',
          '',
          'Autentikasi: kirim `Authorization: Bearer <access_token>` (dari `/auth/login`)',
          'atau `X-API-Key: <key>`. Endpoint publik tidak butuh keduanya.',
          'Envelope sukses `{ data, meta? }`, error `{ error: { code, message, details? } }`.',
        ].join('\n'),
      )
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
      .addApiKey({ type: 'apiKey', name: 'X-API-Key', in: 'header' }, 'api-key')
      .addTag('Auth', 'Login, refresh rotation, API key')
      .addTag('Content', 'CRUD konten, status editorial, locking, meta EAV')
      .addTag('Media', 'Upload & kelola media (MinIO)')
      .addTag('Taxonomy', 'Taxonomy & term')
      .addTag('Author', 'Byline publik')
      .addTag('Comment', 'Komentar & moderasi')
      .addTag('User', 'Akun login & RBAC')
      .addTag('Settings', 'Konfigurasi key-value')
      .addTag('Redirect', 'Redirect URL')
      .addTag('Webhook', 'Event hooks & delivery')
      .addTag('Misc', 'Role, menu, widget, audit')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerCfg);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: { persistAuthorization: true, tagsSorter: 'alpha' },
      customSiteTitle: 'CMS Core API Docs',
    });
  }

  await app.listen(appCfg.port, '0.0.0.0');

  console.log(`CMS Core API berjalan di port ${appCfg.port} (prefix /${appCfg.apiPrefix})`);
}

void bootstrap();
