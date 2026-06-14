-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastOrderAt" TIMESTAMP(3),
ADD COLUMN     "mergedIntoCustomerId" UUID,
ADD COLUMN     "totalOrders" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "customerId" UUID;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_mergedIntoCustomerId_fkey" FOREIGN KEY ("mergedIntoCustomerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
