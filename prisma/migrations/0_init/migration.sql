-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "shop_name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khakhra_items" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "order_id" UUID,
    "khakhra_type" TEXT NOT NULL,
    "quantity_kg" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "price_per_kg" DECIMAL(10,2) DEFAULT 200,
    "total_price" DECIMAL(10,2) DEFAULT 0,
    "is_packet_item" BOOLEAN DEFAULT false,
    "packet_quantity" INTEGER DEFAULT 0,
    "price_per_packet" DECIMAL(10,2) DEFAULT 0,

    CONSTRAINT "khakhra_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "shop_name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "wants_patra" BOOLEAN DEFAULT false,
    "patra_packets" INTEGER DEFAULT 0,
    "total_khakhra_kg" DECIMAL(10,2) DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "due_date" DATE,
    "total_amount" DECIMAL(10,2) DEFAULT 0,
    "patra_price_per_packet" DECIMAL(10,2) DEFAULT 75,
    "wants_bhakarwadi" BOOLEAN DEFAULT false,
    "bhakarwadi_packets" INTEGER DEFAULT 0,
    "bhakarwadi_price_per_packet" DECIMAL(10,2) DEFAULT 60,
    "wants_fulvadi" BOOLEAN DEFAULT false,
    "fulvadi_packets" INTEGER DEFAULT 0,
    "fulvadi_price_per_packet" INTEGER DEFAULT 90,
    "wants_chikki" BOOLEAN DEFAULT false,
    "chikki_packets" INTEGER DEFAULT 0,
    "chikki_price_per_packet" INTEGER DEFAULT 31,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customers_shop_name_trgm_idx" ON "customers" USING GIN ("shop_name" gin_trgm_ops);

-- CreateIndex
CREATE UNIQUE INDEX "customers_shop_name_city_key" ON "customers"("shop_name", "city");

-- CreateIndex
CREATE INDEX "idx_khakhra_items_order_id" ON "khakhra_items"("order_id");

-- CreateIndex
CREATE INDEX "idx_orders_city" ON "orders"("city");

-- CreateIndex
CREATE INDEX "idx_orders_created_at" ON "orders"("created_at");

-- CreateIndex
CREATE INDEX "idx_orders_status" ON "orders"("status");

-- AddForeignKey
ALTER TABLE "khakhra_items" ADD CONSTRAINT "khakhra_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

