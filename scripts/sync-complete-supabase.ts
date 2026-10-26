import { supabase } from "../lib/supabase";
import { prisma } from "../lib/prisma";

async function fetchAllFromSupabase(table: string) {
  let all: any[] = [];
  let from = 0;
  const batchSize = 500;
  while (true) {
    const { data, error } = await supabase.from(table).select("*").range(from, from + batchSize - 1);
    if (error) {
      console.error(`Error fetching ${table}:`, error.message);
      break;
    }
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < batchSize) break;
    from += batchSize;
  }
  return all;
}

async function runCompleteSync() {
  console.log("=== STARTING COMPLETE PRODUCTION DATA SYNC FROM SUPABASE ===");

  // 1. Categories (match by slug)
  console.log("1. Syncing product_categories...");
  const categories = await fetchAllFromSupabase("product_categories");
  for (const c of categories) {
    await prisma.productCategory.upsert({
      where: { slug: c.slug },
      create: {
        id: c.id,
        name: c.name,
        slug: c.slug,
        isActive: c.isActive ?? true,
        displayOrder: c.displayOrder ?? 0,
        createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
        updatedAt: c.updatedAt ? new Date(c.updatedAt) : new Date(),
      },
      update: {
        name: c.name,
        isActive: c.isActive ?? true,
        displayOrder: c.displayOrder ?? 0,
      },
    });
  }
  console.log(`Synced ${categories.length} product categories.`);

  // 2. Products (match by slug)
  console.log("2. Syncing products...");
  const products = await fetchAllFromSupabase("products");
  for (const p of products) {
    // Ensure category exists
    const cat = await prisma.productCategory.findUnique({ where: { id: p.categoryId } });
    if (!cat) continue;

    await prisma.product.upsert({
      where: { slug: p.slug },
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
        isActive: p.isActive ?? true,
      },
    });
  }
  console.log(`Synced ${products.length} products.`);

  // 3. Product Variants
  console.log("3. Syncing product_variants...");
  const variants = await fetchAllFromSupabase("product_variants");
  let varCount = 0;
  for (const v of variants) {
    const prod = await prisma.product.findUnique({ where: { id: v.productId } });
    if (!prod) continue;

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
    varCount++;
  }
  console.log(`Synced ${varCount} product variants.`);

  // 4. Product Pricing
  console.log("4. Syncing product_pricing...");
  const pricingList = await fetchAllFromSupabase("product_pricing");
  let priceCount = 0;
  for (const pr of pricingList) {
    const variantExists = await prisma.productVariant.findUnique({ where: { id: pr.variantId } });
    if (!variantExists) continue;

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
    priceCount++;
  }
  console.log(`Synced ${priceCount} pricing records.`);

  // 5. Customers
  console.log("5. Syncing customers...");
  const customers = await fetchAllFromSupabase("customers");
  for (const c of customers) {
    await prisma.customer.upsert({
      where: { id: c.id },
      create: {
        id: c.id,
        shop_name: c.shop_name,
        city: c.city,
        address: c.address,
        phone: c.phone,
        created_at: c.created_at ? new Date(c.created_at) : new Date(),
        updated_at: c.updated_at ? new Date(c.updated_at) : new Date(),
        lastOrderAt: c.lastOrderAt ? new Date(c.lastOrderAt) : null,
        totalOrders: c.totalOrders || 0,
        isArchived: c.isArchived || false,
      },
      update: {
        shop_name: c.shop_name,
        city: c.city,
        address: c.address,
        phone: c.phone,
        lastOrderAt: c.lastOrderAt ? new Date(c.lastOrderAt) : null,
        totalOrders: c.totalOrders || 0,
        isArchived: c.isArchived || false,
      },
    });
  }
  console.log(`Synced ${customers.length} customers.`);

  // 6. Orders
  console.log("6. Syncing orders...");
  const orders = await fetchAllFromSupabase("orders");
  for (const o of orders) {
    if (!o.customerId) continue;
    const custExists = await prisma.customer.findUnique({ where: { id: o.customerId } });
    if (!custExists) continue;

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

  // 7. Khakhra Items (Legacy orders items)
  console.log("7. Syncing khakhra_items...");
  const khakhraItems = await fetchAllFromSupabase("khakhra_items");
  let kiSynced = 0;
  for (const ki of khakhraItems) {
    if (!ki.order_id) continue;
    const orderExists = await prisma.order.findUnique({ where: { id: ki.order_id } });
    if (!orderExists) continue;

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
    kiSynced++;
  }
  console.log(`Synced ${kiSynced} khakhra_items.`);

  // 8. Order Items (Catalog items)
  console.log("8. Syncing order_items...");
  const orderItems = await fetchAllFromSupabase("order_items");
  let oiSynced = 0;
  for (const oi of orderItems) {
    if (!oi.orderId || !oi.variantId) continue;
    const [orderExists, variantExists] = await Promise.all([
      prisma.order.findUnique({ where: { id: oi.orderId } }),
      prisma.productVariant.findUnique({ where: { id: oi.variantId } }),
    ]);
    if (!orderExists || !variantExists) continue;

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
    oiSynced++;
  }
  console.log(`Synced ${oiSynced} order_items.`);

  // 9. Invoices
  console.log("9. Syncing invoices...");
  const invoices = await fetchAllFromSupabase("invoices");
  for (const inv of invoices) {
    let orderId = inv.orderId;
    if (orderId) {
      const orderExists = await prisma.order.findUnique({ where: { id: orderId } });
      if (!orderExists) orderId = null;
    }
    await prisma.invoice.upsert({
      where: { id: inv.id },
      create: {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        orderId,
        customerId: inv.customerId,
        invoiceDate: inv.invoiceDate ? new Date(inv.invoiceDate) : new Date(),
        dueDate: inv.dueDate ? new Date(inv.dueDate) : null,
        subtotal: Number(inv.subtotal || 0),
        tax: Number(inv.tax || 0),
        total: Number(inv.total || 0),
        paymentStatus: inv.paymentStatus || "PENDING",
        pdfUrl: inv.pdfUrl || "",
        createdAt: inv.createdAt ? new Date(inv.createdAt) : new Date(),
        updatedAt: inv.updatedAt ? new Date(inv.updatedAt) : new Date(),
      },
      update: {
        invoiceNumber: inv.invoiceNumber,
        orderId,
        customerId: inv.customerId,
        invoiceDate: inv.invoiceDate ? new Date(inv.invoiceDate) : undefined,
        dueDate: inv.dueDate ? new Date(inv.dueDate) : null,
        subtotal: Number(inv.subtotal || 0),
        tax: Number(inv.tax || 0),
        total: Number(inv.total || 0),
        paymentStatus: inv.paymentStatus || "PENDING",
        pdfUrl: inv.pdfUrl || "",
      },
    });
  }
  console.log(`Synced ${invoices.length} invoices.`);

  // 10. Sequences
  console.log("10. Syncing sequences...");
  const sequences = await fetchAllFromSupabase("invoice_sequences");
  for (const s of sequences) {
    await prisma.invoiceSequence.upsert({
      where: { year: s.year },
      create: {
        year: s.year,
        currentValue: s.currentValue,
        updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date(),
      },
      update: {
        currentValue: s.currentValue,
      },
    });
  }
  console.log(`Synced ${sequences.length} invoice sequences.`);

  console.log("=== COMPLETE PRODUCTION DATA SYNC FINISHED SUCCESSFULLY! ===");
}

runCompleteSync()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
