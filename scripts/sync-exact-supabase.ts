import { supabase } from "../lib/supabase";
import { prisma } from "../lib/prisma";

async function fetchAllFromSupabase(table: string, batchSize = 1000) {
  let all: any[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase.from(table).select("*").range(from, from + batchSize - 1);
    if (error) {
      console.error(`Error fetching ${table}:`, error);
      break;
    }
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < batchSize) break;
    from += batchSize;
  }
  return all;
}

async function main() {
  console.log("=== STARTING EXACT SUPABASE SYNC ===");

  // 1. Clean local tables to remove all stale/corrupted/duplicate data
  console.log("Truncating local tables...");
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE 
      order_items, 
      khakhra_items, 
      invoices, 
      invoice_sequences,
      orders, 
      customers, 
      product_pricing, 
      pricing_history, 
      inventory_levels, 
      product_variants, 
      products, 
      product_categories 
    CASCADE;
  `);
  console.log("Cleaned local tables.");

  // 2. Product Categories
  console.log("Syncing product_categories...");
  const categories = await fetchAllFromSupabase("product_categories");
  for (const cat of categories) {
    await prisma.productCategory.upsert({
      where: { slug: cat.slug },
      create: {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        isActive: cat.isActive ?? true,
        displayOrder: cat.displayOrder || 0,
        createdAt: cat.createdAt ? new Date(cat.createdAt) : new Date(),
        updatedAt: cat.updatedAt ? new Date(cat.updatedAt) : new Date(),
      },
      update: {
        name: cat.name,
        isActive: cat.isActive ?? true,
        displayOrder: cat.displayOrder || 0,
      },
    });
  }
  console.log(`Synced ${categories.length} categories.`);

  // 3. Products
  console.log("Syncing products...");
  const products = await fetchAllFromSupabase("products");
  for (const p of products) {
    await prisma.product.upsert({
      where: { id: p.id },
      create: {
        id: p.id,
        categoryId: p.categoryId,
        name: p.name,
        slug: p.slug,
        isActive: p.isActive ?? true,
        createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
        updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
      },
      update: {
        categoryId: p.categoryId,
        name: p.name,
        slug: p.slug,
        isActive: p.isActive ?? true,
      },
    });
  }
  console.log(`Synced ${products.length} products.`);

  // 4. Product Variants
  console.log("Syncing product_variants...");
  const variants = await fetchAllFromSupabase("product_variants");
  for (const v of variants) {
    await prisma.productVariant.upsert({
      where: { id: v.id },
      create: {
        id: v.id,
        productId: v.productId,
        name: v.name,
        sku: v.sku || null,
        weightKg: v.weightKg != null ? Number(v.weightKg) : null,
        unitType: v.unitType || "PACKET",
        isActive: v.isActive ?? true,
        inventoryTracked: v.inventoryTracked ?? false,
        createdAt: v.createdAt ? new Date(v.createdAt) : new Date(),
        updatedAt: v.updatedAt ? new Date(v.updatedAt) : new Date(),
      },
      update: {
        productId: v.productId,
        name: v.name,
        sku: v.sku || null,
        weightKg: v.weightKg != null ? Number(v.weightKg) : null,
        unitType: v.unitType || "PACKET",
        isActive: v.isActive ?? true,
        inventoryTracked: v.inventoryTracked ?? false,
      },
    });
  }
  console.log(`Synced ${variants.length} product variants.`);

  // 5. Product Pricing
  console.log("Syncing product_pricing...");
  const pricingList = await fetchAllFromSupabase("product_pricing");
  for (const pr of pricingList) {
    await prisma.productPricing.upsert({
      where: { id: pr.id },
      create: {
        id: pr.id,
        variantId: pr.variantId,
        pricingType: pr.pricingType || "FIXED",
        costPrice: Number(pr.costPrice || 0),
        minSellingPrice: pr.minSellingPrice != null ? Number(pr.minSellingPrice) : null,
        maxSellingPrice: pr.maxSellingPrice != null ? Number(pr.maxSellingPrice) : null,
        effectiveFrom: pr.effectiveFrom ? new Date(pr.effectiveFrom) : new Date(),
        effectiveTo: pr.effectiveTo ? new Date(pr.effectiveTo) : null,
        createdAt: pr.createdAt ? new Date(pr.createdAt) : new Date(),
        updatedAt: pr.updatedAt ? new Date(pr.updatedAt) : new Date(),
      },
      update: {
        costPrice: Number(pr.costPrice || 0),
        minSellingPrice: pr.minSellingPrice != null ? Number(pr.minSellingPrice) : null,
        maxSellingPrice: pr.maxSellingPrice != null ? Number(pr.maxSellingPrice) : null,
      },
    });
  }
  console.log(`Synced ${pricingList.length} product pricings.`);

  // 6. Customers
  console.log("Syncing customers...");
  const customers = await fetchAllFromSupabase("customers");
  for (const c of customers) {
    await prisma.customer.upsert({
      where: { id: c.id },
      create: {
        id: c.id,
        shop_name: c.shop_name,
        city: c.city,
        address: c.address || null,
        phone: c.phone || null,
        created_at: c.created_at ? new Date(c.created_at) : new Date(),
        updated_at: c.updated_at ? new Date(c.updated_at) : new Date(),
        totalOrders: c.totalOrders || 0,
        lastOrderAt: c.lastOrderAt ? new Date(c.lastOrderAt) : null,
        isArchived: c.isArchived ?? false,
      },
      update: {
        shop_name: c.shop_name,
        city: c.city,
        address: c.address || null,
        phone: c.phone || null,
        totalOrders: c.totalOrders || 0,
        lastOrderAt: c.lastOrderAt ? new Date(c.lastOrderAt) : null,
        isArchived: c.isArchived ?? false,
      },
    });
  }
  console.log(`Synced ${customers.length} customers.`);

  // 7. Orders
  console.log("Syncing orders...");
  const orders = await fetchAllFromSupabase("orders");
  for (const o of orders) {
    await prisma.order.upsert({
      where: { id: o.id },
      create: {
        id: o.id,
        shop_name: o.shop_name || "Unknown",
        address: o.address || "",
        city: o.city || "",
        customerId: o.customerId,
        status: o.status || "pending",
        wants_patra: o.wants_patra ?? false,
        patra_packets: o.patra_packets ?? 0,
        total_khakhra_kg: o.total_khakhra_kg ?? 0,
        created_at: o.created_at ? new Date(o.created_at) : new Date(),
        updated_at: o.updated_at ? new Date(o.updated_at) : new Date(),
        due_date: o.due_date ? new Date(o.due_date) : null,
        total_amount: o.total_amount ?? 0,
        patra_price_per_packet: o.patra_price_per_packet ?? 75,
        wants_bhakarwadi: o.wants_bhakarwadi ?? false,
        bhakarwadi_packets: o.bhakarwadi_packets ?? 0,
        bhakarwadi_price_per_packet: o.bhakarwadi_price_per_packet ?? 60,
        wants_fulvadi: o.wants_fulvadi ?? false,
        fulvadi_packets: o.fulvadi_packets ?? 0,
        fulvadi_price_per_packet: o.fulvadi_price_per_packet ?? 90,
        wants_chikki: o.wants_chikki ?? false,
        chikki_packets: o.chikki_packets ?? 0,
        chikki_price_per_packet: o.chikki_price_per_packet ?? 31,
      },
      update: {
        shop_name: o.shop_name || "Unknown",
        address: o.address || "",
        city: o.city || "",
        customerId: o.customerId,
        status: o.status,
        wants_patra: o.wants_patra ?? false,
        patra_packets: o.patra_packets ?? 0,
        total_khakhra_kg: o.total_khakhra_kg ?? 0,
        total_amount: o.total_amount,
        patra_price_per_packet: o.patra_price_per_packet ?? 75,
        wants_bhakarwadi: o.wants_bhakarwadi ?? false,
        bhakarwadi_packets: o.bhakarwadi_packets ?? 0,
        bhakarwadi_price_per_packet: o.bhakarwadi_price_per_packet ?? 60,
        wants_fulvadi: o.wants_fulvadi ?? false,
        fulvadi_packets: o.fulvadi_packets ?? 0,
        fulvadi_price_per_packet: o.fulvadi_price_per_packet ?? 90,
        wants_chikki: o.wants_chikki ?? false,
        chikki_packets: o.chikki_packets ?? 0,
        chikki_price_per_packet: o.chikki_price_per_packet ?? 31,
        created_at: o.created_at ? new Date(o.created_at) : undefined,
      },
    });
  }
  console.log(`Synced ${orders.length} orders.`);

  // 8. Khakhra Items
  console.log("Syncing khakhra_items...");
  const khakhraItems = await fetchAllFromSupabase("khakhra_items");
  for (const ki of khakhraItems) {
    if (!ki.order_id) continue;
    await prisma.khakhraItem.upsert({
      where: { id: ki.id },
      create: {
        id: ki.id,
        order_id: ki.order_id,
        khakhra_type: ki.khakhra_type || "Regular",
        quantity_kg: Number(ki.quantity_kg || 0),
        price_per_kg: Number(ki.price_per_kg || 200),
        total_price: Number(ki.total_price || 0),
        is_packet_item: ki.is_packet_item || false,
        packet_quantity: Number(ki.packet_quantity || 0),
        price_per_packet: Number(ki.price_per_packet || 0),
        created_at: ki.created_at ? new Date(ki.created_at) : new Date(),
      },
      update: {
        khakhra_type: ki.khakhra_type || "Regular",
        quantity_kg: Number(ki.quantity_kg || 0),
        price_per_kg: Number(ki.price_per_kg || 200),
        total_price: Number(ki.total_price || 0),
        is_packet_item: ki.is_packet_item || false,
        packet_quantity: Number(ki.packet_quantity || 0),
        price_per_packet: Number(ki.price_per_packet || 0),
      },
    });
  }
  console.log(`Synced ${khakhraItems.length} khakhra_items.`);

  // 9. Order Items (Only Real Supabase Order Items)
  console.log("Syncing order_items...");
  const orderItems = await fetchAllFromSupabase("order_items");
  for (const oi of orderItems) {
    if (!oi.orderId || !oi.variantId) continue;
    await prisma.orderItem.upsert({
      where: { id: oi.id },
      create: {
        id: oi.id,
        orderId: oi.orderId,
        variantId: oi.variantId,
        quantity: Number(oi.quantity || 1),
        productName: oi.productName || "Product",
        categoryName: oi.categoryName || "General",
        variantName: oi.variantName || "Packet",
        unitCostPrice: Number(oi.unitCostPrice || 0),
        unitSellingPrice: Number(oi.unitSellingPrice || 0),
        totalCost: Number(oi.totalCost || 0),
        totalRevenue: Number(oi.totalRevenue || 0),
        totalProfit: Number(oi.totalProfit || 0),
        createdAt: oi.createdAt ? new Date(oi.createdAt) : new Date(),
        updatedAt: oi.updatedAt ? new Date(oi.updatedAt) : new Date(),
      },
      update: {
        quantity: Number(oi.quantity || 1),
        productName: oi.productName || "Product",
        categoryName: oi.categoryName || "General",
        variantName: oi.variantName || "Packet",
        unitCostPrice: Number(oi.unitCostPrice || 0),
        unitSellingPrice: Number(oi.unitSellingPrice || 0),
        totalCost: Number(oi.totalCost || 0),
        totalRevenue: Number(oi.totalRevenue || 0),
        totalProfit: Number(oi.totalProfit || 0),
      },
    });
  }
  console.log(`Synced ${orderItems.length} order_items.`);

  // 10. Invoices
  console.log("Syncing invoices...");
  const invoices = await fetchAllFromSupabase("invoices");
  for (const inv of invoices) {
    await prisma.invoice.upsert({
      where: { id: inv.id },
      create: {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        orderId: inv.orderId || null,
        customerId: inv.customerId,
        invoiceDate: inv.invoiceDate ? new Date(inv.invoiceDate) : new Date(),
        dueDate: inv.dueDate ? new Date(inv.dueDate) : null,
        subtotal: Number(inv.subtotal || 0),
        tax: Number(inv.tax || 0),
        total: Number(inv.total || 0),
        paymentStatus: (inv.paymentStatus || "PENDING").toUpperCase(),
        pdfUrl: inv.pdfUrl || null,
        createdAt: inv.createdAt ? new Date(inv.createdAt) : new Date(),
        updatedAt: inv.updatedAt ? new Date(inv.updatedAt) : new Date(),
      },
      update: {
        invoiceNumber: inv.invoiceNumber,
        orderId: inv.orderId || null,
        customerId: inv.customerId,
        subtotal: Number(inv.subtotal || 0),
        tax: Number(inv.tax || 0),
        total: Number(inv.total || 0),
        paymentStatus: (inv.paymentStatus || "PENDING").toUpperCase(),
        pdfUrl: inv.pdfUrl || null,
      },
    });
  }
  console.log(`Synced ${invoices.length} invoices.`);

  // 11. Invoice Sequences
  console.log("Syncing invoice_sequences...");
  const seqs = await fetchAllFromSupabase("invoice_sequences");
  for (const seq of seqs) {
    await prisma.invoiceSequence.upsert({
      where: { year: Number(seq.year) },
      create: {
        year: Number(seq.year),
        currentValue: Number(seq.currentValue || 0),
        updatedAt: seq.updatedAt ? new Date(seq.updatedAt) : new Date(),
      },
      update: {
        currentValue: Number(seq.currentValue || 0),
      },
    });
  }
  console.log(`Synced ${seqs.length} invoice sequences.`);

  // Verification step
  const totalOrdersCount = await prisma.order.count();
  const revenueAgg = await prisma.order.aggregate({ _sum: { total_amount: true } });
  const itemRevAgg = await prisma.orderItem.aggregate({ _sum: { totalRevenue: true } });
  console.log("=== SYNC COMPLETE ===");
  console.log("Total Orders:", totalOrdersCount);
  console.log("Order Total Amount Sum:", revenueAgg._sum.total_amount);
  console.log("OrderItem Total Revenue Sum:", itemRevAgg._sum.totalRevenue);
}

main()
  .catch((e) => {
    console.error("Sync failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
