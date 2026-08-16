import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const siteUrl = process.argv[2] ?? 'http://localhost:4200';

async function main() {
  const tables = await prisma.restaurantTable.findMany({ orderBy: { code: 'asc' } });
  for (const table of tables) {
    console.log(`${table.code}\t${table.label}\t${siteUrl}/order?table=${table.qrToken}`);
  }
  await prisma.$disconnect();
}

main().catch(async (error: unknown) => {
  console.error(error);
  await prisma.$disconnect();
  process.exitCode = 1;
});
