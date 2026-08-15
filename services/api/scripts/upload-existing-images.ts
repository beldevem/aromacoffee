import 'dotenv/config';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '../src/generated/prisma/client';

const imageRoot = path.resolve(__dirname, '../../../apps/web/public/images');
const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? 'product-images';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

function imageFile(slug: string): { filePath: string; extension: string; contentType: string } {
  const candidates = [
    { extension: 'jpg', contentType: 'image/jpeg' },
    { extension: 'png', contentType: 'image/png' },
    { extension: 'webp', contentType: 'image/webp' },
  ];
  const candidate = candidates.find(({ extension }) => existsSync(path.join(imageRoot, `${slug}.${extension}`)));
  if (!candidate) throw new Error(`Missing local image for product: ${slug}`);
  return { ...candidate, filePath: path.join(imageRoot, `${slug}.${candidate.extension}`) };
}

async function main(): Promise<void> {
  const url = process.env.SUPABASE_URL;
  if (!url || !supabaseKey || !process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL, SUPABASE_URL, and SUPABASE_SECRET_KEY are required.');
  }

  const supabase = createClient(url, supabaseKey);
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

  try {
    const { error: bucketError } = await supabase.storage.createBucket(bucket, {
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      fileSizeLimit: 5 * 1024 * 1024,
      public: true,
    });
    if (bucketError && !bucketError.message.toLowerCase().includes('already exists')) {
      throw new Error(`Bucket setup failed: ${bucketError.message}`);
    }
    const { error: bucketLimitError } = await supabase.storage.updateBucket(bucket, {
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      fileSizeLimit: 10 * 1024 * 1024,
      public: true,
    });
    if (bucketLimitError) throw new Error(`Bucket configuration failed: ${bucketLimitError.message}`);

    const products = await prisma.product.findMany({ select: { id: true, slug: true }, orderBy: { slug: 'asc' } });
    for (const product of products) {
      const image = imageFile(product.slug);
      const storagePath = `products/${product.slug}.${image.extension}`;
      const file = await readFile(image.filePath);
      const { error: uploadError } = await supabase.storage.from(bucket).upload(storagePath, file, {
        cacheControl: '3600',
        contentType: image.contentType,
        upsert: true,
      });
      if (uploadError) throw new Error(`${product.slug}: ${uploadError.message}`);

      const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
      await prisma.product.update({ where: { id: product.id }, data: { imageUrl: data.publicUrl } });
      console.log(`Uploaded ${product.slug}`);
    }
    console.log(`Uploaded ${products.length} product images to ${bucket}.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
