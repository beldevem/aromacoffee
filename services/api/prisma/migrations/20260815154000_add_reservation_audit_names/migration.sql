-- Track the actor that created and last changed each reservation.
ALTER TABLE "reservations"
ADD COLUMN "created_by" TEXT NOT NULL DEFAULT 'customer',
ADD COLUMN "last_updated_by" TEXT;