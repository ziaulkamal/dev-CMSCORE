// src/modules/menus/menus.service.ts — Menu & menu item (tree 2 tingkat).
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { MenuItemInput } from './dto/menu.dto';

/** Slug menu default (panel hanya kelola satu menu navigasi utama). */
const DEFAULT_MENU_SLUG = 'primary';

/** Bentuk node tree yang dikonsumsi FE MenuBuilder. */
export interface MenuNode {
  id: string;
  label: string;
  url: string;
  source: string;
  ref_id: string | null;
  children: MenuNode[];
}

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.menu.findMany({ take: 50 });
  }

  /** Pastikan menu default ada (auto-provision saat pertama dipakai). */
  private async ensureDefaultMenu() {
    return this.prisma.menu.upsert({
      where: { slug: DEFAULT_MENU_SLUG },
      update: {},
      create: { slug: DEFAULT_MENU_SLUG, name: 'Menu Utama' },
    });
  }

  /** Ambil tree menu default (top-level + 1 tingkat anak), terurut sortOrder. */
  async getTree(): Promise<MenuNode[]> {
    const menu = await this.ensureDefaultMenu();
    const items = await this.prisma.menuItem.findMany({
      where: { menuId: menu.id },
      orderBy: { sortOrder: 'asc' },
    });

    const toNode = (i: (typeof items)[number]): MenuNode => ({
      id: i.id,
      label: i.label,
      url: i.url ?? '',
      source: i.source,
      ref_id: i.refId ?? i.contentId ?? null,
      children: [],
    });

    const roots = items.filter((i) => !i.parentId).map(toNode);
    const byId = new Map(roots.map((n) => [n.id, n]));
    for (const i of items) {
      if (i.parentId && byId.has(i.parentId)) byId.get(i.parentId)!.children.push(toNode(i));
    }
    return roots;
  }

  /**
   * Ganti seluruh item menu default dari tree FE (hapus-lalu-buat dalam transaksi).
   * Mempertahankan urutan via sortOrder; menyimpan source + ref_id (+ contentId bila page).
   */
  async replaceItems(tree: MenuItemInput[]): Promise<MenuNode[]> {
    const menu = await this.ensureDefaultMenu();

    await this.prisma.$transaction(async (tx) => {
      await tx.menuItem.deleteMany({ where: { menuId: menu.id } });

      let order = 0;
      for (const parent of tree) {
        const created = await tx.menuItem.create({
          data: {
            menuId: menu.id,
            label: parent.label,
            url: parent.url ?? null,
            source: parent.source ?? 'custom',
            refId: parent.ref_id ?? null,
            contentId: parent.source === 'page' ? (parent.ref_id ?? null) : null,
            sortOrder: order++,
          },
        });

        let childOrder = 0;
        for (const child of parent.children ?? []) {
          await tx.menuItem.create({
            data: {
              menuId: menu.id,
              parentId: created.id,
              label: child.label,
              url: child.url ?? null,
              source: child.source ?? 'custom',
              refId: child.ref_id ?? null,
              contentId: child.source === 'page' ? (child.ref_id ?? null) : null,
              sortOrder: childOrder++,
            },
          });
        }
      }
    });

    return this.getTree();
  }
}
