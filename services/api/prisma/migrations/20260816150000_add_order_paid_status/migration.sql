-- Kept in its own migration: Postgres will not let a newly added enum value be used
-- in the same transaction that adds it.
ALTER TYPE "OrderStatus" ADD VALUE 'PAID';
