// src/common/filters/all-exceptions.filter.ts — pusat pemetaan error → envelope error seragam.
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

interface ErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

/** Tangkap semua exception, jangan bocorkan internal; format `{ error: {...} }`. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    const { status, body } = this.normalize(exception);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    }

    res.status(status).json({ error: body });
  }

  /** Petakan exception ke status + body aman; sembunyikan detail 5xx dari klien. */
  private normalize(exception: unknown): { status: number; body: ErrorBody } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const resp = exception.getResponse();

      if (typeof resp === 'object' && resp !== null && 'code' in resp) {
        return { status, body: resp as ErrorBody };
      }

      const message =
        typeof resp === 'string'
          ? resp
          : ((resp as { message?: string | string[] }).message ?? exception.message);

      return {
        status,
        body: {
          code: this.statusToCode(status),
          message: Array.isArray(message) ? message.join('; ') : message,
        },
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: { code: 'INTERNAL_ERROR', message: 'Terjadi kesalahan internal.' },
    };
  }

  private statusToCode(status: number): string {
    const map: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'VALIDATION_ERROR',
      423: 'CONTENT_LOCKED',
      429: 'RATE_LIMITED',
    };
    return map[status] ?? 'ERROR';
  }
}
