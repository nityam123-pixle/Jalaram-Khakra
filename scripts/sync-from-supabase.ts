import { supabase } from "../lib/supabase";
import { prisma } from "../lib/prisma";

async function syncAll() {
  console.log("Starting sync from Supabase to local Postgres...");

  // 1. Sync Customers
  console.log("Syncing customers...");
  const { data: customers, error: custErr } = await supabase.from("customers").select("*");
  if (custErr) throw custErr;
  console.log(`Fetched ${customers.length} customers from Supabase.`);

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
  console.log("Customers synced.");

  // 2. Sync Orders
  console.log("Syncing orders...");
  // Paginate orders in batches of 500
  let allOrders: any[] = [];
  let from = 0;
  while (true) {
    const { data: batch, error } = await supabase.from("orders").select("*").range(from, from + 499);
    if (error) throw error;
    if (!batch || batch.length === 0) break;
    allOrders = allOrders.concat(batch);
    if (batch.length < 500) break;
    from += 500;
  }
  console.log(`Fetched ${allOrders.length} orders from Supabase.`);

  for (const o of allOrders) {
    // Ensure customerId exists
    if (!o.customerId) continue;

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
        shop_name: o.shop_name,
        address: o.address,
        city: o.city,
        customerId: o.customerId,
        status: o.status,
        total_amount: o.total_amount,
        created_at: o.created_at ? new Date(o.created_at) : undefined,
      },
    });
  }
  console.log("Orders synced.");

  // 3. Sync Invoices
  console.log("Syncing invoices...");
  let allInvoices: any[] = [];
  from = 0;
  while (true) {
    const { data: batch, error } = await supabase.from("invoices").select("*").range(from, from + 499);
    if (error) throw error;
    if (!batch || batch.length === 0) break;
    allInvoices = allInvoices.concat(batch);
    if (batch.length < 500) break;
    from += 500;
  }
  console.log(`Fetched ${allInvoices.length} invoices from Supabase.`);

  for (const inv of allInvoices) {
    // Check if order exists in local DB
    let orderId = inv.orderId;
    if (orderId) {
      const orderExists = await prisma.order.findUnique({ where: { id: orderId } });
      if (!orderExists) {
        orderId = null;
      }
    }

    await prisma.invoice.upsert({
      where: { id: inv.id },
      create: {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        orderId: orderId,
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
        orderId: orderId,
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
  console.log("Invoices synced.");

  // 4. Sync Invoice Sequences
  console.log("Syncing invoice sequences...");
  const { data: seqs } = await supabase.from("invoice_sequences").select("*");
  if (seqs) {
    for (const s of seqs) {
      await prisma.invoiceSequence.upsert({
        where: { year: s.year },
        create: {
          year: s.year,
          currentValue: s.currentValue,
          updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date(),
        },
        update: {
          currentValue: s.currentValue,
          updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date(),
        },
      });
    }
  }
  console.log("Invoice sequences synced.");

  console.log("ALL DATA SYNCED SUCCESSFULLY!");
}

syncAll()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
