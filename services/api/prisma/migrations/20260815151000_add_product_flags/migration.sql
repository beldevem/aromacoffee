-- CreateTable
CREATE TABLE "flags" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "label_fr" TEXT NOT NULL,
    "label_ar" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "flags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "flags_slug_key" ON "flags"("slug");

-- AlterTable
ALTER TABLE "products" ADD COLUMN "flag_id" UUID;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_flag_id_fkey" FOREIGN KEY ("flag_id") REFERENCES "flags"("id") ON DELETE SET NULL ON UPDATE CASCADE;