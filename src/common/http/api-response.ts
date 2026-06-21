// src/common/http/api-response.ts — envelope sukses & tipe meta (PRD §10).

export interface ResponseMeta {
  [key: string]: unknown;
  next_cursor?: string | null;
  limit?: number;
}

export interface ApiSuccess<T> {
  data: T;
  meta?: ResponseMeta;
}

/** Bungkus payload ke envelope `{ data, meta? }`. */
export function ok<T>(data: T, meta?: ResponseMeta): ApiSuccess<T> {
  return meta ? { data, meta } : { data };
}
