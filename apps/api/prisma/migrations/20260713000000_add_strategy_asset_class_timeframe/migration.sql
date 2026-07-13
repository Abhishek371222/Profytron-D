-- CreateEnum
CREATE TYPE "AssetClass" AS ENUM ('Forex', 'Crypto', 'Indices', 'Commodities');

-- CreateEnum
CREATE TYPE "Timeframe" AS ENUM ('M1', 'M5', 'M15', 'H1', 'H4', 'D1');

-- AlterTable
ALTER TABLE "Strategy" ADD COLUMN IF NOT EXISTS "assetClass" "AssetClass";
ALTER TABLE "Strategy" ADD COLUMN IF NOT EXISTS "timeframe" "Timeframe";
