-- CreateEnum
CREATE TYPE "Intent" AS ENUM ('PRICING', 'DEMO', 'PRODUCT_INFO', 'OTHER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "MonthlyVisitors" AS ENUM ('UNDER_10K', 'BETWEEN_10K_100K', 'OVER_100K', 'UNKNOWN');

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "intent" "Intent" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "monthlyVisitors" "MonthlyVisitors" NOT NULL DEFAULT 'UNKNOWN';
