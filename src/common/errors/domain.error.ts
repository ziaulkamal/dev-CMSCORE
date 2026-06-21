// src/common/errors/domain.error.ts — error domain bertipe, dipetakan ke HTTP di filter.
import { HttpException, HttpStatus } from '@nestjs/common';

/** Error aplikasi dengan kode mesin (envelope error PRD §10). */
export class DomainError extends HttpException {
  constructor(
    status: HttpStatus,
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super({ code, message, details }, status);
  }
}

export class NotFoundError extends DomainError {
  constructor(message = 'Resource tidak ditemukan', details?: Record<string, unknown>) {
    super(HttpStatus.NOT_FOUND, 'NOT_FOUND', message, details);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = 'Akses ditolak', details?: Record<string, unknown>) {
    super(HttpStatus.FORBIDDEN, 'FORBIDDEN', message, details);
  }
}

export class ConflictError extends DomainError {
  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(HttpStatus.CONFLICT, code, message, details);
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = 'Autentikasi diperlukan', details?: Record<string, unknown>) {
    super(HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED', message, details);
  }
}

export class LockedError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(HttpStatus.LOCKED, 'CONTENT_LOCKED', message, details);
  }
}

export class ValidationError extends DomainError {
  constructor(message = 'Data tidak valid', details?: Record<string, unknown>) {
    super(HttpStatus.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR', message, details);
  }
}
