-- CreateEnum
CREATE TYPE "OrderChannel" AS ENUM ('QR', 'COUNTER');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD');

-- AlterTable
ALTER TABLE "orders"
  ALTER COLUMN "table_id" DROP NOT NULL,
  ALTER COLUMN "session_id" DROP NOT NULL,
  ADD COLUMN "takeaway" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "channel" "OrderChannel" NOT NULL DEFAULT 'QR',
  ADD COLUMN "created_by" TEXT NOT NULL DEFAULT 'customer',
  ADD COLUMN "validated_by" TEXT,
  ADD COLUMN "validated_at" TIMESTAMP(3),
  ADD COLUMN "paid_by" TEXT,
  ADD COLUMN "paid_at" TIMESTAMP(3),
  ADD COLUMN "payment_method" "PaymentMethod";

-- CreateIndex
CREATE INDEX "orders_channel_created_at_idx" ON "orders"("channel", "created_at");

-- CreateIndex
CREATE INDEX "orders_paid_at_idx" ON "orders"("paid_at");
