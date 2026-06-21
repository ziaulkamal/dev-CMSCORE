// src/common/auth/authenticated-user.ts — bentuk principal yang menempel di request.

/** Identitas terautentikasi yang dipakai guard & service. */
export interface AuthenticatedUser {
  id: string;
  email: string;
  roles: string[];
  capabilities: string[];
  /** true bila request datang via API key, bukan JWT. */
  viaApiKey?: boolean;
}
