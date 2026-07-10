/**
 * src/common/bootstrap/rbac.constants.ts
 * Sumber tunggal definisi RBAC (capability & role → capability) sesuai matriks PRD §9.
 * Dipakai oleh RbacBootstrapService (in-app, dev & prod) dan prisma/seed.ts (dev).
 */

/** Daftar capability sesuai matriks RBAC PRD §9. */
export const CAPABILITIES = [
  'edit_post',
  'edit_others_post',
  'publish_post',
  'delete_post',
  'override_lock',
  'manage_comments',
  'manage_media',
  'manage_users',
  'ban_users',
  'manage_roles',
  'manage_settings',
  'read',
] as const;

export type Capability = (typeof CAPABILITIES)[number];

/** Mapping role → capabilities (PRD §9). */
export const ROLES: Record<string, { label: string; caps: Capability[] }> = {
  super_admin: { label: 'Super Admin', caps: [...CAPABILITIES] },
  admin: { label: 'Admin', caps: [...CAPABILITIES] },
  editor: {
    label: 'Editor',
    caps: [
      'edit_post',
      'edit_others_post',
      'publish_post',
      'delete_post',
      'override_lock',
      'manage_comments',
      'manage_media',
      'read',
    ],
  },
  author: { label: 'Author', caps: ['edit_post', 'manage_media', 'read'] },
  contributor: { label: 'Contributor', caps: ['edit_post', 'read'] },
  viewer: { label: 'Viewer', caps: ['read'] },
};

/** Kredensial admin default — HANYA boleh dipakai di non-produksi. */
export const DEFAULT_ADMIN_EMAIL = 'admin@cmscore.local';
export const DEFAULT_ADMIN_PASSWORD = 'ChangeMe123!';

/** Taksonomi dasar yang selalu dipastikan ada. */
export const BASE_TAXONOMIES = [
  { slug: 'category', label: 'Category', hierarchical: true },
  { slug: 'tag', label: 'Tag', hierarchical: false },
] as const;
