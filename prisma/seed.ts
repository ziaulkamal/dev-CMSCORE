/**
 * prisma/seed.ts
 * Seed RBAC (roles, capabilities, mapping PRD §9), taxonomy dasar, super admin.
 */
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import {
  CAPABILITIES,
  ROLES,
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_ADMIN_PASSWORD,
} from '../src/common/bootstrap/rbac.constants';

const prisma = new PrismaClient();

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
  const email = process.env.SEED_ADMIN_EMAIL ?? DEFAULT_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD;
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
