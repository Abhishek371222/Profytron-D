-- Backfills migration history for four enum types that were already applied
-- to the live database via `prisma db push` without ever being captured as
-- a migration file. This left the chain unable to replay cleanly from
-- scratch (20260711000000_add_payment_invoice_support_ticket_tables uses
-- all four, but no prior migration ever created them).
-- Resolved with `prisma migrate resolve --applied` rather than run for
-- real, since these types already exist on the live database.

CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

CREATE TYPE "PaymentMethod" AS ENUM ('UPI', 'CARD', 'NETBANKING', 'WALLET', 'CRYPTO', 'STRIPE', 'PAYPAL');

CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

CREATE TYPE "SupportTicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
