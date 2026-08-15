-- Add a required seating location with a safe default for existing reservations.
ALTER TABLE "reservations" ADD COLUMN "location" TEXT NOT NULL DEFAULT 'N/A';