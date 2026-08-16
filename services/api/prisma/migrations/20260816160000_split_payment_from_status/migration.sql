-- Paid orders were necessarily handed over, so they become SERVED; paid_at/paid_by/payment_method
-- already carry the payment facts and are left untouched.
UPDATE "orders" SET "status" = 'SERVED' WHERE "status" = 'PAID';

-- AlterEnum
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PREPARING', 'SERVED', 'CANCELLED');
ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "orders" ALTER COLUMN "status" TYPE "OrderStatus" USING ("status"::text::"OrderStatus");
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'PENDING';
DROP TYPE "OrderStatus_old";
