/**
 * src/modules/users/users.service.ts
 * User & akun login (PRD §9/§10): listing aman (tanpa hash), create + assign role.
 */
import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConflictError, ValidationError } from '../../common/errors/domain.error';
import { CreateUserDto } from './dto/create-user.dto';

/** Proyeksi aman: jangan pernah kembalikan password_hash ke klien. */
const SAFE_SELECT = {
  id: true,
  email: true,
  status: true,
  createdAt: true,
  roles: { select: { role: { select: { name: true } } } },
} as const;

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.user.findMany({
      take: 50,
      select: SAFE_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Buat user: hash password (argon2), validasi & assign role dalam satu transaksi. */
  async create(dto: CreateUserDto) {
    const dup = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (dup) throw new ConflictError('EMAIL_EXISTS', 'Email sudah terdaftar');

    const roles = await this.prisma.role.findMany({ where: { name: { in: dto.roles } } });
    if (roles.length !== dto.roles.length) {
      throw new ValidationError('Sebagian role tidak dikenal', { roles: dto.roles });
    }

    const passwordHash = await argon2.hash(dto.password);
    return this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        roles: { create: roles.map((r) => ({ roleId: r.id })) },
      },
      select: SAFE_SELECT,
    });
  }
}
