-- Preserve the existing display price as the original price in cents.
UPDATE "products"
SET "og_price" = ROUND(REPLACE((regexp_match("price_label", '([0-9]+([.,][0-9]+)?)'))[1], ',', '.')::numeric * 100)::integer
WHERE "price_label" IS NOT NULL AND "og_price" IS NULL;

-- Promotional price is meaningful only for promoted products.
UPDATE "products" SET "promo_price" = NULL WHERE "promotion" = false;

ALTER TABLE "products" DROP COLUMN "price_label";