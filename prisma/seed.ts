/**
 * prisma/seed.ts
 * Seed RBAC (roles, capabilities, mapping PRD §9), taxonomy dasar, super admin.
 */
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

/** Daftar capability sesuai matriks RBAC PRD §9. */
const CAPABILITIES = [
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

/** Mapping role → capabilities (PRD §9). */
const ROLES: Record<string, { label: string; caps: string[] }> = {
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

async function seedCapabilities() {
  for (const key of CAPABILITIES) {
    await prisma.capability.upsert({ where: { key }, update: {}, create: { key } });
  }
}

async function seedRoles() {
  for (const [name, { label, caps }] of Object.entries(ROLES)) {
    const role = await prisma.role.upsert({
      where: { name },
      update: { label },
      create: { name, label },
    });

    for (const key of caps) {
      const cap = await prisma.capability.findUniqueOrThrow({ where: { key } });
      await prisma.roleCapability.upsert({
        where: { roleId_capabilityId: { roleId: role.id, capabilityId: cap.id } },
        update: {},
        create: { roleId: role.id, capabilityId: cap.id },
      });
    }
  }
}

async function seedSuperAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@cmscore.local';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';
  const passwordHash = await argon2.hash(password);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash },
  });

  const role = await prisma.role.findUniqueOrThrow({ where: { name: 'super_admin' } });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    update: {},
    create: { userId: user.id, roleId: role.id },
  });

  // eslint-disable-next-line no-console
  console.log(`Super admin siap: ${email} (password default: ${password})`);
}

async function seedTaxonomies() {
  await prisma.taxonomy.upsert({
    where: { slug: 'category' },
    update: {},
    create: { slug: 'category', label: 'Category', hierarchical: true },
  });
  await prisma.taxonomy.upsert({
    where: { slug: 'tag' },
    update: {},
    create: { slug: 'tag', label: 'Tag', hierarchical: false },
  });
}

async function main() {
  await seedCapabilities();
  await seedRoles();
  await seedTaxonomies();
  await seedSuperAdmin();
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
