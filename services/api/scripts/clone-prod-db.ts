import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

async function cloneDatabase(): Promise<void> {
  const prodUrl = process.env.PROD_DATABASE_URL ?? process.env.DATABASE_URL;
  const localUrl = process.env.LOCAL_DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/aroma';

  if (!prodUrl) {
    throw new Error('Missing production DATABASE_URL or PROD_DATABASE_URL.');
  }

  if (prodUrl === localUrl) {
    throw new Error('Production URL and Local URL cannot be the same! Ensure LOCAL_DATABASE_URL points to your local database.');
  }

  console.log('🔄 Starting Production to Local Database Clone...');
  console.log(`📥 Source (Prod): ${prodUrl.replace(/:[^:@]*@/, ':****@')}`);
  console.log(`📤 Target (Local): ${localUrl.replace(/:[^:@]*@/, ':****@')}`);

  // Create isolated clients
  const sourcePrisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: prodUrl }) });
  const targetPrisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: localUrl }) });

  try {
    // 1. Fetch data from production (strictly read-only)
    console.log('\n[1/4] Reading data from production database...');
    const [
      users,
      categories,
      flags,
      products,
      tables,
      openingHours,
      blockedDates,
      reservations,
      orders,
      orderItems,
      auditLogs,
    ] = await Promise.all([
      sourcePrisma.user.findMany(),
      sourcePrisma.category.findMany(),
      sourcePrisma.flag.findMany(),
      sourcePrisma.product.findMany(),
      sourcePrisma.restaurantTable.findMany(),
      sourcePrisma.openingHour.findMany(),
      sourcePrisma.blockedDate.findMany(),
      sourcePrisma.reservation.findMany(),
      sourcePrisma.order.findMany(),
      sourcePrisma.orderItem.findMany(),
      sourcePrisma.auditLog.findMany(),
    ]);

    console.log(`✅ Read from Production:
  - Users:             ${users.length}
  - Categories:        ${categories.length}
  - Flags / Badges:    ${flags.length}
  - Products:          ${products.length}
  - Restaurant Tables: ${tables.length}
  - Opening Hours:     ${openingHours.length}
  - Blocked Dates:     ${blockedDates.length}
  - Reservations:      ${reservations.length}
  - Orders:            ${orders.length}
  - Order Items:       ${orderItems.length}
  - Audit Logs:        ${auditLogs.length}`);

    // 2. Clean local database in reverse dependency order
    console.log('\n[2/4] Resetting local database tables...');
    await targetPrisma.orderItem.deleteMany();
    await targetPrisma.order.deleteMany();
    await targetPrisma.auditLog.deleteMany();
    await targetPrisma.product.deleteMany();
    await targetPrisma.flag.deleteMany();
    await targetPrisma.category.deleteMany();
    await targetPrisma.restaurantTable.deleteMany();
    await targetPrisma.reservation.deleteMany();
    await targetPrisma.openingHour.deleteMany();
    await targetPrisma.blockedDate.deleteMany();
    await targetPrisma.user.deleteMany();

    // 3. Insert into local database in dependency order
    console.log('\n[3/4] Populating local database with production data...');

    if (users.length) {
      await targetPrisma.user.createMany({ data: users });
      console.log(`  ✓ Inserted ${users.length} users`);
    }

    if (categories.length) {
      await targetPrisma.category.createMany({ data: categories });
      console.log(`  ✓ Inserted ${categories.length} categories`);
    }

    if (flags.length) {
      await targetPrisma.flag.createMany({ data: flags });
      console.log(`  ✓ Inserted ${flags.length} flags`);
    }

    if (products.length) {
      await targetPrisma.product.createMany({ data: products });
      console.log(`  ✓ Inserted ${products.length} products`);
    }

    if (tables.length) {
      await targetPrisma.restaurantTable.createMany({ data: tables });
      console.log(`  ✓ Inserted ${tables.length} tables`);
    }

    if (openingHours.length) {
      await targetPrisma.openingHour.createMany({ data: openingHours });
      console.log(`  ✓ Inserted ${openingHours.length} opening hours`);
    }

    if (blockedDates.length) {
      await targetPrisma.blockedDate.createMany({ data: blockedDates });
      console.log(`  ✓ Inserted ${blockedDates.length} blocked dates`);
    }

    if (reservations.length) {
      await targetPrisma.reservation.createMany({ data: reservations });
      console.log(`  ✓ Inserted ${reservations.length} reservations`);
    }

    if (orders.length) {
      await targetPrisma.order.createMany({ data: orders });
      console.log(`  ✓ Inserted ${orders.length} orders`);
    }

    if (orderItems.length) {
      await targetPrisma.orderItem.createMany({ data: orderItems });
      console.log(`  ✓ Inserted ${orderItems.length} order items`);
    }

    if (auditLogs.length) {
      await targetPrisma.auditLog.createMany({
        data: auditLogs.map((log) => ({
          ...log,
          metadata: log.metadata === null ? undefined : (log.metadata as any),
        })),
      });
      console.log(`  ✓ Inserted ${auditLogs.length} audit logs`);
    }

    console.log('\n[4/4] ✨ Successfully cloned production database to local database!');
  } finally {
    await Promise.all([sourcePrisma.$disconnect(), targetPrisma.$disconnect()]);
  }
}

cloneDatabase().catch((error: unknown) => {
  console.error('\n❌ Database clone failed:', error);
  process.exitCode = 1;
});
