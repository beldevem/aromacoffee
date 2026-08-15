-- AlterTable
ALTER TABLE "products"
ADD COLUMN "promotion" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "og_price" INTEGER,
ADD COLUMN "promo_price" INTEGER;