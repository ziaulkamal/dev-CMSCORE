// src/common/pagination/cursor.ts — encode/decode cursor opaque untuk listing feed (PRD §10).

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

export interface CursorPayload {
  id: string;
  createdAt: string;
}

/** Normalisasi limit ke rentang aman. */
export function normalizeLimit(raw?: number | string): number {
  const n = typeof raw === 'string' ? parseInt(raw, 10) : raw;
  if (!n || Number.isNaN(n) || n < 1) return DEFAULT_LIMIT;
  return Math.min(n, MAX_LIMIT);
}

/** Encode payload cursor menjadi string base64url opaque. */
export function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

/** Decode cursor; lempar null bila tidak valid (jangan throw 500). */
export function decodeCursor(cursor?: string): CursorPayload | null {
  if (!cursor) return null;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    if (typeof parsed?.id === 'string' && typeof parsed?.createdAt === 'string') {
      return parsed as CursorPayload;
    }
    return null;
  } catch {
    return null;
  }
}
