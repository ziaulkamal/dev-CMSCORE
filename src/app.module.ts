/**
 * src/app.module.ts
 * Root module: config global, infra (Prisma/Redis), throttler, semua feature module,
 * dan provider global (auth guard, capability guard, exception filter).
 */
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import configuration from './common/config/configuration';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { CapabilitiesGuard } from './common/guards/capabilities.guard';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

import { AuthModule } from './modules/auth/auth.module';
import { ContentModule } from './modules/content/content.module';
import { UserModule } from './modules/users/users.module';
import { RoleModule } from './modules/roles/roles.module';
import { AuthorModule } from './modules/authors/authors.module';
import { TaxonomyModule } from './modules/taxonomies/taxonomies.module';
import { MediaModule } from './modules/media/media.module';
import { CommentModule } from './modules/comments/comments.module';
import { MenuModule } from './modules/menus/menus.module';
import { WidgetModule } from './modules/widgets/widgets.module';
import { SettingModule } from './modules/settings/settings.module';
import { RedirectModule } from './modules/redirects/redirects.module';
import { WebhookModule } from './modules/webhooks/webhooks.module';
import { AuditModule } from './modules/audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('throttle.ttl', 60) * 1000,
          limit: config.get<number>('throttle.limit', 100),
        },
      ],
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    ContentModule,
    UserModule,
    RoleModule,
    AuthorModule,
    TaxonomyModule,
    MediaModule,
    CommentModule,
    MenuModule,
    WidgetModule,
    SettingModule,
    RedirectModule,
    WebhookModule,
    AuditModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: CapabilitiesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
