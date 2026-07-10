/**
 * src/common/bootstrap/bootstrap.module.ts
 * Modul startup: jalankan RbacBootstrapService (RBAC + super admin) saat app boot.
 * PrismaService tersedia global via PrismaModule.
 */
import { Module } from '@nestjs/common';
import { RbacBootstrapService } from './rbac-bootstrap.service';

@Module({
  providers: [RbacBootstrapService],
})
export class BootstrapModule {}
