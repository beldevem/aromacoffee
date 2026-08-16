import 'dotenv/config';
import { randomBytes, scryptSync } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, ProductStatus } from '../src/generated/prisma/client';
import { MENU_CATEGORIES } from '../../../apps/web/src/app/core/menu/menu-data';

const categoryNames: Record<string, { name: string; nameFr: string; nameAr: string }> = {
  'coffee.hot': { name: 'Hot Coffees', nameFr: 'Cafés chauds', nameAr: 'القهوة الساخنة' },
  'coffee.cold': { name: 'Iced Coffees', nameFr: 'Cafés glacés', nameAr: 'القهوة المثلجة' },
  'coffee.frappuccino': { name: 'Frappuccinos', nameFr: 'Frappuccinos', nameAr: 'فرابوتشينو' },
  chocolates: { name: 'Gourmet Chocolates', nameFr: 'Chocolats gourmands', nameAr: 'شوكولاتة فاخرة' },
  'drinks.fresh-juices': { name: 'Fresh Juices', nameFr: 'Jus frais pressés', nameAr: 'عصائر طازجة' },
  milkshakes: { name: 'Milkshakes', nameFr: 'Milkshakes', nameAr: 'ميلك شيك' },
  smoothies: { name: 'Smoothies', nameFr: 'Smoothies', nameAr: 'سموثي' },
  mojitos: { name: 'Mojitos', nameFr: 'Mojitos', nameAr: 'موهيتو' },
  'signature-cocktails': { name: 'Signature Cocktails', nameFr: 'Cocktails signature', nameAr: 'كوكتيلات خاصة' },
  breakfast: { name: 'Breakfasts', nameFr: 'Petits déjeuners', nameAr: 'الفطور' },
  omelettes: { name: 'Omelettes', nameFr: 'Omelettes', nameAr: 'أومليت' },
  'sweet-crepes': { name: 'Sweet Crepes', nameFr: 'Crêpes sucrées', nameAr: 'كريب حلو' },
  'waffles-pancakes': { name: 'Waffles & Pancakes', nameFr: 'Gaufres & Pancakes', nameAr: 'وافل وبان كيك' },
  'savory-desserts': { name: 'Savory Crepes & Desserts', nameFr: 'Crêpes salées & Desserts', nameAr: 'كريب مالح وحلويات' },
  'jwajem-drinks': { name: 'Jwajem & Drinks', nameFr: 'Jwajem & Boissons', nameAr: 'جواجم ومشروبات' },
  'evening-packs': { name: 'Evening Packs', nameFr: 'Packs soir', nameAr: 'باقات المساء' },
};

const flagDefinitions = [
  { slug: 'most-ordered', label: 'Most ordered', labelFr: 'Le plus commandé', labelAr: 'الأكثر طلباً' },
  { slug: 'signature', label: 'Signature', labelFr: 'Signature', labelAr: 'خاص بنا' },
  { slug: 'favorite', label: 'Guest favorite', labelFr: 'Favori des clients', labelAr: 'المفضل لدى الزوار' },
  { slug: 'popular', label: 'Popular', labelFr: 'Populaire', labelAr: 'شائع' },
  { slug: 'promotion', label: 'Promotion', labelFr: 'Promotion', labelAr: 'عرض خاص' },
];

const productFlags: Record<string, string> = {
  cappuccino: 'most-ordered',
  'frappuccino-pistachio': 'signature',
  'breakfast-classic': 'favorite',
  'crepe-aroma-special': 'signature',
  'pack-friends': 'popular',
};

function priceCents(priceLabel: string): number {
  const firstPrice = priceLabel.match(/[0-9]+(?:[.,][0-9]+)?/)?.[0] ?? '0';
  return Math.round(Number(firstPrice.replace(',', '.')) * 100);
}

function imageUrl(slug: string): string {
  const extension = slug === 'water-half-liter' ? 'png' : 'jpg';
  return `/images/${slug}.${extension}`;
}

function promotionFor(slug: string): { promotion: boolean; ogPrice: number | null; promoPrice: number | null } {
  if (slug === 'cappuccino') return { promotion: true, ogPrice: 1200, promoPrice: 900 };
  return { promotion: false, ogPrice: null, promoPrice: null };
}

function passwordHash(password: string): string {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}

async function seed(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required to seed the database.');
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin12345!';
    const agentPassword = process.env.AGENT_PASSWORD ?? 'Agent12345!';
    await prisma.user.upsert({ where: { email: 'admin@aroma.local' }, update: { name: 'Administrateur Aroma', role: 'ADMIN', active: true }, create: { name: 'Administrateur Aroma', email: 'admin@aroma.local', passwordHash: passwordHash(adminPassword), role: 'ADMIN' } });
    await prisma.user.upsert({ where: { email: 'agent@aroma.local' }, update: { name: 'Agent Aroma', role: 'STAFF', active: true }, create: { name: 'Agent Aroma', email: 'agent@aroma.local', passwordHash: passwordHash(agentPassword), role: 'STAFF' } });
    for (const [categoryIndex, category] of MENU_CATEGORIES.entries()) {
      const names = categoryNames[category.key];
      if (!names) {
        throw new Error(`Missing translated category names for ${category.key}`);
      }

      const savedCategory = await prisma.category.upsert({
        where: { slug: category.key },
        update: { ...names, sortOrder: categoryIndex, visible: true },
        create: { slug: category.key, ...names, sortOrder: categoryIndex, visible: true },
      });

      const flags = new Map<string, string>();
      for (const definition of flagDefinitions) {
        const flag = await prisma.flag.upsert({
          where: { slug: definition.slug },
          update: definition,
          create: definition,
        });
        flags.set(flag.slug, flag.id);
      }

      for (const [itemIndex, item] of category.items.entries()) {
        const promotion = promotionFor(item.slug);
        const originalPrice = promotion.ogPrice ?? priceCents(item.price);
        const effectivePrice = promotion.promoPrice ?? originalPrice;
        const flagId = productFlags[item.slug] ? flags.get(productFlags[item.slug]) : null;
        await prisma.product.upsert({
          where: { slug: item.slug },
          update: {
            name: item.name.en,
            nameFr: item.name.fr,
            nameAr: item.name.ar,
            description: item.description.en,
            descriptionFr: item.description.fr,
            descriptionAr: item.description.ar,
            priceCents: effectivePrice,
            ...promotion,
            ogPrice: originalPrice,
            promoPrice: promotion.promotion ? effectivePrice : null,
            flagId,
            imageUrl: imageUrl(item.slug),
            categoryId: savedCategory.id,
            sortOrder: itemIndex,
            status: ProductStatus.PUBLISHED,
          },
          create: {
            slug: item.slug,
            name: item.name.en,
            nameFr: item.name.fr,
            nameAr: item.name.ar,
            description: item.description.en,
            descriptionFr: item.description.fr,
            descriptionAr: item.description.ar,
            priceCents: effectivePrice,
            ...promotion,
            ogPrice: originalPrice,
            promoPrice: promotion.promotion ? effectivePrice : null,
            flagId,
            imageUrl: imageUrl(item.slug),
            tags: [category.key],
            allergens: [],
            categoryId: savedCategory.id,
            sortOrder: itemIndex,
            status: ProductStatus.PUBLISHED,
          },
        });
      }
    }

    for (let tableNumber = 1; tableNumber <= 12; tableNumber += 1) {
      const code = `T${String(tableNumber).padStart(2, '0')}`;
      await prisma.restaurantTable.upsert({
        where: { code },
        update: {},
        create: { code, label: `Table ${tableNumber}`, seats: 4, qrToken: randomBytes(32).toString('hex') },
      });
    }

    const categoryCount = await prisma.category.count();
    const productCount = await prisma.product.count();
    const tableCount = await prisma.restaurantTable.count();
    console.log(`Seed complete: ${categoryCount} categories, ${productCount} products, ${tableCount} tables.`);
  } finally {
    await prisma.$disconnect();
  }
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});