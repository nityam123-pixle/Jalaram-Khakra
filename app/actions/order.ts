"use server"

import { prisma } from "../../lib/prisma"
import { revalidatePath } from "next/cache"
import { serializePrisma } from "../../lib/prisma-serializer"

function revalidateAllPaths(orderId?: string) {
  try {
    revalidatePath("/orders")
    revalidatePath("/")
    revalidatePath("/summary")
    revalidatePath("/inventory")
    if (orderId) {
      revalidatePath(`/orders/${orderId}`)
    }
  } catch (err) {
    console.warn("[revalidateAllPaths] Non-fatal revalidation notice:", err)
  }
}


export type PriceOverrideApproval = {
  approved: boolean
  approvedBy?: string
  reason?: string
}

export type OrderItemInput = {
  variantId: string
  quantity: number
  sellingPrice: number
}

export type CreateOrderInput = {
  customerId: string
  dueDate?: Date
  items: OrderItemInput[]
  priceOverrideApproval?: PriceOverrideApproval
}

export async function createOrder(data: CreateOrderInput) {
  console.log("[createOrder] Incoming request for customer:", data.customerId)
  console.log("[createOrder] Items received:", JSON.stringify(data.items, null, 2))

  if (!data.customerId || !data.items || data.items.length === 0) {
    throw new Error("Missing customerId or items")
  }

  // Fetch the pricing and product info for all submitted variants
  const variantIds = data.items.map((i) => i.variantId).filter(Boolean)
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: {
      product: {
        include: { category: true }
      },
      pricingRules: {
        where: { effectiveTo: null },
        orderBy: { effectiveFrom: 'desc' },
        take: 1
      }
    }
  })

  const variantMap = new Map(variants.map(v => [v.id, v]))

  let totalAmount = 0
  let totalKhakhraKg = 0 // Legacy compatibility, approximate

  const overriddenItems: {
    productName: string
    variantName: string
    sellingPrice: number
    minSellingPrice: number | null
    maxSellingPrice: number | null
    reason: string
  }[] = []

  const orderItemsData = data.items.map((itemInput) => {
    const variant = variantMap.get(itemInput.variantId)
    const productName = variant?.product?.name || "Unknown Product"
    const categoryName = variant?.product?.category?.name || "General"
    const variantName = variant?.name || "Default"
    const unitType = variant?.unitType || "KG"

    const pricing = variant?.pricingRules?.[0]
    const sellingPrice = Number(itemInput.sellingPrice || 0)
    let costPrice = 0

    const isAdjustment = productName.toLowerCase().includes('outstanding balance') || 
                         categoryName.toLowerCase().includes('adjustment')

    if (pricing) {
      costPrice = Number(pricing.costPrice || 0)
      const minSell = pricing.minSellingPrice != null ? Number(pricing.minSellingPrice) : null
      const maxSell = pricing.maxSellingPrice != null ? Number(pricing.maxSellingPrice) : null

      if (minSell != null && sellingPrice < minSell) {
        overriddenItems.push({
          productName,
          variantName,
          sellingPrice,
          minSellingPrice: minSell,
          maxSellingPrice: maxSell,
          reason: `Selling price ₹${sellingPrice} is below configured minimum ₹${minSell}`
        })
      } else if (maxSell != null && sellingPrice > maxSell) {
        overriddenItems.push({
          productName,
          variantName,
          sellingPrice,
          minSellingPrice: minSell,
          maxSellingPrice: maxSell,
          reason: `Selling price ₹${sellingPrice} is above configured maximum ₹${maxSell}`
        })
      }
    } else {
      costPrice = isAdjustment ? sellingPrice : 0
      if (!isAdjustment) {
        console.warn(`[createOrder] WARNING: No pricing configured for ${productName} ${variantName}. Defaulting costPrice to 0.`)
      }
    }

    const qty = Number(itemInput.quantity || 0)
    const totalRevenue = sellingPrice * qty
    const totalCost = costPrice * qty
    const totalProfit = totalRevenue - totalCost

    totalAmount += totalRevenue
    
    // Legacy calculation for total_khakhra_kg if the category is Khakhra
    if (unitType === 'KG' && categoryName.toLowerCase().includes('khakhra')) {
      totalKhakhraKg += qty
    } else if (unitType === 'PACKET' && categoryName.toLowerCase().includes('khakhra')) {
      totalKhakhraKg += qty * 0.2 // rough estimate 200g per packet
    }

    return {
      variantId: variant?.id || itemInput.variantId,
      quantity: qty,
      productName,
      categoryName,
      variantName,
      unitCostPrice: costPrice,
      unitSellingPrice: sellingPrice,
      totalCost,
      totalRevenue,
      totalProfit,
    }
  })

  // Enforce pricing rule validation unless explicit override was confirmed
  if (overriddenItems.length > 0 && !data.priceOverrideApproval?.approved) {
    const errorDetails = overriddenItems.map(o => `${o.productName} (${o.variantName}): entered ₹${o.sellingPrice} (range ₹${o.minSellingPrice ?? '-'} – ₹${o.maxSellingPrice ?? '-'})`).join("; ")
    throw new Error(`Price override approval required: ${errorDetails}`)
  }

  const approver = data.priceOverrideApproval?.approvedBy || "Admin / Owner"
  const overrideReason = data.priceOverrideApproval?.reason || "Special negotiated price"
  const hasOverrides = overriddenItems.length > 0 && data.priceOverrideApproval?.approved

  if (hasOverrides) {
    console.log(`[PRICE_OVERRIDE_APPROVED] Approved by: ${approver} at ${new Date().toISOString()}. Reason: ${overrideReason}. Overridden items:`, overriddenItems)
  }

  console.log("[createOrder] Calculated Totals:", { totalAmount, totalKhakhraKg, itemCount: orderItemsData.length })

  if (totalAmount <= 0 || orderItemsData.length === 0) {
    throw new Error("At least one valid item with a positive revenue is required to create an order.")
  }

  // Start transaction with row-level locked invoice sequence
  const result = await prisma.$transaction(async (tx) => {
    // Get customer to copy snapshot fields
    const customer = await tx.customer.findUnique({
      where: { id: data.customerId }
    })
    
    if (!customer) throw new Error("Customer not found")

    // Update customer lastOrderAt and totalOrders safely
    await tx.customer.update({
      where: { id: customer.id },
      data: {
        lastOrderAt: new Date(),
        totalOrders: { increment: 1 }
      }
    })

    const currentYear = new Date().getFullYear()

    // 1. Ensure the sequence row exists for the current year
    await tx.$executeRaw`
      INSERT INTO "invoice_sequences" (year, "currentValue", "updatedAt")
      VALUES (${currentYear}, 0, NOW())
      ON CONFLICT (year) DO NOTHING;
    `

    // 2. Lock the sequence row with FOR UPDATE to prevent any simultaneous sequence race condition
    const lockedRows = await tx.$queryRaw<{ year: number; currentValue: number }[]>`
      SELECT year, "currentValue"
      FROM "invoice_sequences"
      WHERE year = ${currentYear}
      FOR UPDATE;
    `

    const currentLockedVal = Number(lockedRows[0]?.currentValue || 0)

    // 3. Self-healing check: query highest existing invoice number for this year
    const latestInvoice = await tx.invoice.findFirst({
      where: { invoiceNumber: { startsWith: `INV-${currentYear}-` } },
      orderBy: { invoiceNumber: 'desc' },
      select: { invoiceNumber: true }
    })

    let highestExistingNum = 0
    if (latestInvoice?.invoiceNumber) {
      const lastNum = parseInt(latestInvoice.invoiceNumber.split('-')[2], 10)
      if (!isNaN(lastNum)) highestExistingNum = lastNum
    }

    const nextSeqValue = Math.max(currentLockedVal, highestExistingNum) + 1
    const invoiceNumber = `INV-${currentYear}-${String(nextSeqValue).padStart(5, '0')}`

    // 4. Update the locked sequence row to the new value
    await tx.$executeRaw`
      UPDATE "invoice_sequences"
      SET "currentValue" = ${nextSeqValue}, "updatedAt" = NOW()
      WHERE year = ${currentYear};
    `

    // Create the Order
    const order = await tx.order.create({
      data: {
        customerId: customer.id,
        shop_name: customer.shop_name || "Unknown Shop",
        city: customer.city || "",
        address: customer.address || "",
        due_date: data.dueDate,
        total_amount: totalAmount,
        total_khakhra_kg: totalKhakhraKg,
        status: "pending",
        // Create order items directly
        items: {
          create: orderItemsData
        }
      },
      include: {
        items: true
      }
    })

    // Create Invoice inside the same database transaction
    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber,
        orderId: order.id,
        customerId: customer.id,
        invoiceDate: new Date(),
        dueDate: data.dueDate,
        subtotal: totalAmount,
        tax: 0,
        total: totalAmount,
        paymentStatus: "PENDING"
      }
    })

    // Build audit note prefix
    const auditNote = hasOverrides 
      ? `[PRICE OVERRIDE APPROVED by ${approver} on ${new Date().toLocaleDateString('en-IN')}: ${overrideReason}] ` 
      : ""

    // Update inventory and stock ledger for tracked variants (batched for performance)
    const trackedVariantIds = orderItemsData.map((i) => i.variantId).filter(Boolean)
    const inventories = trackedVariantIds.length > 0
      ? await tx.inventoryLevel.findMany({
          where: { variantId: { in: trackedVariantIds } }
        })
      : []
    const inventoryMap = new Map(inventories.map((inv) => [inv.variantId, inv]))

    for (const item of orderItemsData) {
      if (item.variantId) {
        const inventory = inventoryMap.get(item.variantId)

        if (inventory) {
          const prevStock = Number(inventory.availableStock || 0)
          const newStock = prevStock - item.quantity
          await tx.inventoryLevel.update({
            where: { variantId: item.variantId },
            data: { availableStock: { decrement: item.quantity } }
          })

          await tx.stockLedger.create({
            data: {
              variantId: item.variantId,
              action: "SOLD_THROUGH_ORDER",
              quantity: -item.quantity,
              previousStock: prevStock,
              newStock,
              reference: order.id,
              notes: `${auditNote}Order #${order.id.slice(0,8)} created for ${customer.shop_name || "customer"}`
            }
          })
        }
      }
    }

    console.log("[createOrder] Order created successfully:", order.id, "Invoice:", invoiceNumber)
    return { order, invoice, customer, invoiceNumber }
  }, {
    maxWait: 15000,
    timeout: 35000,
  })

  try {
    const finalPdfUrl = `/api/pdf/invoice/${result.invoice.id}`;
    await prisma.invoice.update({
      where: { id: result.invoice.id },
      data: { pdfUrl: finalPdfUrl }
    });
    result.invoice.pdfUrl = finalPdfUrl;
  } catch (err) {
    console.error("[createOrder] Failed to update PDF invoice URL:", err);
  }

  revalidateAllPaths(result.order.id)
  
  return serializePrisma({
    ...result.order,
    invoice: result.invoice,
  })
}

export async function getOrderById(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      items: {
        include: {
          variant: {
            include: {
              product: true
            }
          }
        }
      }
    }
  })
  return serializePrisma(order)
}

export async function updateOrderStatus(id: string, status: string) {
  const order = await prisma.order.update({
    where: { id },
    data: { status }
  })

  // Sync invoice status with order status
  const lowerStatus = status.toLowerCase();
  if (lowerStatus === 'delivered' || lowerStatus === 'completed') {
    await prisma.invoice.updateMany({
      where: { orderId: id },
      data: { paymentStatus: 'PAID' }
    });
  } else if (lowerStatus === 'cancelled') {
    await prisma.invoice.updateMany({
      where: { orderId: id },
      data: { paymentStatus: 'CANCELLED' }
    });
  } else {
    // For pending, confirmed, processing, etc.
    await prisma.invoice.updateMany({
      where: { orderId: id },
      data: { paymentStatus: 'PENDING' }
    });
  }

  revalidateAllPaths(id)
  return serializePrisma(order)
}

export async function deleteOrder(id: string) {
  // Run inside a database transaction to ensure atomicity
  await prisma.$transaction(async (tx) => {
    // 1. Fetch order details (including items and customer info)
    const order = await tx.order.findUnique({
      where: { id },
      include: {
        items: true,
        customer: true,
      }
    })
    
    if (!order) throw new Error("Order not found")

    // 2. Restore stock and write to ledger for each item
    for (const item of order.items) {
      const inventory = await tx.inventoryLevel.findUnique({
        where: { variantId: item.variantId }
      })

      if (inventory) {
        // Increment stock
        const updatedInventory = await tx.inventoryLevel.update({
          where: { variantId: item.variantId },
          data: { availableStock: { increment: item.quantity } }
        })

        // Log to Stock Ledger
        await tx.stockLedger.create({
          data: {
            variantId: item.variantId,
            action: "RETURN_RECEIVED",
            quantity: item.quantity,
            previousStock: inventory.availableStock,
            newStock: updatedInventory.availableStock,
            reference: order.id,
            notes: `Order #${order.id.slice(0, 8).toUpperCase()} deleted. Restoring stock.`
          }
        })
      }
    }

    // 3. Decrement customer totalOrders count
    if (order.customer) {
      await tx.customer.update({
        where: { id: order.customerId },
        data: {
          totalOrders: { decrement: 1 }
        }
      })
    }

    // 4. Finally delete the order
    await tx.order.delete({
      where: { id }
    })
  })

  // 5. Revalidate paths
  revalidateAllPaths(id)
}

export async function getAllOrders(filters?: {
  search?: string;
  status?: string;
  city?: string;
  date?: string;
  fromDate?: string;
  toDate?: string;
  product?: string;
  page?: number;
  limit?: number;
  sortColumn?: "date" | "total";
  sortDirection?: "asc" | "desc";
}) {
  const where: any = {};

  if (filters) {
    if (filters.status && filters.status !== "all") {
      where.status = { equals: filters.status, mode: "insensitive" };
    }
    if (filters.city && filters.city !== "all") {
      where.city = { equals: filters.city, mode: "insensitive" };
    }

    // Date range filtering (From Date -> To Date)
    if (filters.fromDate || filters.toDate || filters.date) {
      const dateCond: any = {};
      if (filters.fromDate) {
        const start = new Date(filters.fromDate);
        start.setUTCHours(0, 0, 0, 0);
        dateCond.gte = start;
      } else if (filters.date) {
        const start = new Date(filters.date);
        start.setUTCHours(0, 0, 0, 0);
        dateCond.gte = start;
      }

      if (filters.toDate) {
        const end = new Date(filters.toDate);
        end.setUTCHours(23, 59, 59, 999);
        dateCond.lte = end;
      } else if (filters.date) {
        const end = new Date(filters.date);
        end.setUTCHours(23, 59, 59, 999);
        dateCond.lte = end;
      }

      if (Object.keys(dateCond).length > 0) {
        where.created_at = dateCond;
      }
    }

    if (filters.product && filters.product !== "all") {
      where.items = {
        some: {
          variantId: filters.product
        }
      };
    }

    // Multi-Token, Order ID, and Product-aware Fuzzy Search
    if (filters.search && filters.search.trim()) {
      const rawSearch = filters.search.trim();
      const tokens = rawSearch.split(/\s+/).filter(Boolean);

      const tokenConditions: any[] = [];

      for (const rawToken of tokens) {
        const token = rawToken.replace(/^[#]/, "");
        const orClauses: any[] = [
          { shop_name: { contains: token, mode: "insensitive" as const } },
          { city: { contains: token, mode: "insensitive" as const } },
          { status: { contains: token, mode: "insensitive" as const } },
          { customer: { is: { shop_name: { contains: token, mode: "insensitive" as const } } } },
          { customer: { is: { phone: { contains: token, mode: "insensitive" as const } } } },
          { customer: { is: { city: { contains: token, mode: "insensitive" as const } } } },
          { items: { some: { productName: { contains: token, mode: "insensitive" as const } } } },
          { items: { some: { categoryName: { contains: token, mode: "insensitive" as const } } } },
          { items: { some: { variantName: { contains: token, mode: "insensitive" as const } } } }
        ];

        // If token looks like a partial UUID (hex or hyphens, min 4 chars), find matching order IDs
        if (/^[0-9a-fA-F-]{4,}$/.test(token)) {
          try {
            const matchingIds: { id: string }[] = await prisma.$queryRaw`SELECT id FROM orders WHERE id::text ILIKE ${'%' + token + '%'}`;
            if (matchingIds.length > 0) {
              orClauses.push({ id: { in: matchingIds.map(m => m.id) } });
            }
          } catch (e) {
            // Ignore queryRaw errors if any
          }
        }

        tokenConditions.push({ OR: orClauses });
      }

      if (tokenConditions.length === 1) {
        where.OR = tokenConditions[0].OR;
      } else if (tokenConditions.length > 1) {
        where.AND = tokenConditions;
      }
    }
  }

  // Handle pagination
  const page = filters?.page || 1;
  const limit = filters?.limit || 10;
  const skip = (page - 1) * limit;

  // Handle sorting
  let orderBy: any = { created_at: 'desc' };
  if (filters?.sortColumn) {
    const direction = filters.sortDirection || 'desc';
    if (filters.sortColumn === 'date') {
      orderBy = { created_at: direction };
    } else if (filters.sortColumn === 'total') {
      orderBy = { total_amount: direction };
    }
  }

  // Execute queries in parallel
  const [orders, totalCount] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        customer: true,
        items: {
          include: {
            variant: {
              select: { unitType: true } // Only select what's needed for UI badges
            }
          }
        }
      }
    }),
    prisma.order.count({ where })
  ]);

  return serializePrisma({
    data: orders,
    totalCount
  });
}

export async function getOrderStats() {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0,0,0,0);

  const [
    totalOrders,
    pendingOrders,
    completedOrders,
    revenueResult,
    itemRevResult,
    customersCount,
    citiesQuery,
    cityGroup,
    ordersThisMonth,
    topProductGroup,
    customerOrderGroups
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: { equals: "pending", mode: "insensitive" } } }),
    prisma.order.count({ where: { status: { in: ["completed", "delivered"], mode: "insensitive" } } }),
    prisma.order.aggregate({ _sum: { total_amount: true } }),
    prisma.orderItem.aggregate({ _sum: { totalRevenue: true } }),
    prisma.customer.count(),
    prisma.order.findMany({ select: { city: true }, distinct: ['city'] }),
    prisma.order.groupBy({
      by: ['city'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 1
    }),
    prisma.order.count({ where: { created_at: { gte: startOfMonth } } }),
    prisma.orderItem.groupBy({
      by: ['productName', 'variantName'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 1
    }),
    prisma.order.groupBy({
      by: ['customerId'],
      _count: { id: true }
    })
  ]);

  const totalRevenue = Math.max(
    Number(revenueResult._sum.total_amount || 0),
    Number(itemRevResult._sum.totalRevenue || 0)
  );

  const topProduct = topProductGroup[0]
    ? `${topProductGroup[0].productName} (${topProductGroup[0].variantName})`
    : "N/A";

  const totalCustomersWithOrders = customerOrderGroups.length;
  const repeatCustomersCount = customerOrderGroups.filter(g => g._count.id >= 2).length;
  const repeatPercent = totalCustomersWithOrders > 0
    ? Math.round((repeatCustomersCount / totalCustomersWithOrders) * 100)
    : 0;

  return {
    totalOrders,
    pendingOrders,
    completedOrders,
    totalRevenue,
    customersCount,
    citiesCount: citiesQuery.filter(c => c.city).length,
    // Insights
    topCity: cityGroup[0]?.city || "N/A",
    aov: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    ordersThisMonth,
    topProduct,
    repeatPercent
  };
}

export async function getUniqueCities() {
  const cities = await prisma.order.findMany({
    select: { city: true },
    distinct: ['city']
  });
  
  return cities
    .filter(c => c.city)
    .map(c => c.city.trim().toLowerCase())
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort();
}

export type EditOrderItemInput = {
  variantId: string
  quantity: number
  sellingPrice: number
}

export async function updateOrderItems(orderId: string, items: EditOrderItemInput[]) {
  console.log("[updateOrderItems] Order ID:", orderId, "Items:", JSON.stringify(items, null, 2))

  if (!orderId || !items || items.length === 0) {
    throw new Error("Order ID and at least one item is required.")
  }

  // Fetch variant details for calculation
  const variantIds = items.map(i => i.variantId).filter(Boolean)
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: {
      product: {
        include: { category: true }
      },
      pricingRules: {
        where: { effectiveTo: null },
        orderBy: { effectiveFrom: 'desc' },
        take: 1
      }
    }
  })

  const variantMap = new Map(variants.map(v => [v.id, v]))

  let totalAmount = 0
  let totalKhakhraKg = 0

  const orderItemsData = items.map((itemInput) => {
    const variant = variantMap.get(itemInput.variantId)
    const productName = variant?.product?.name || "Unknown Product"
    const categoryName = variant?.product?.category?.name || "General"
    const variantName = variant?.name || "Default"
    const unitType = variant?.unitType || "KG"

    const isAdjustment = productName.toLowerCase().includes('outstanding balance') || 
                         categoryName.toLowerCase().includes('adjustment')

    const pricing = variant?.pricingRules?.[0]
    const sellingPrice = Number(itemInput.sellingPrice || 0)
    let costPrice = 0

    if (pricing) {
      costPrice = Number(pricing.costPrice || 0)
      if (pricing.minSellingPrice && sellingPrice < Number(pricing.minSellingPrice)) {
        console.warn(`[updateOrderItems] Selling price ${sellingPrice} is below minimum ${pricing.minSellingPrice} for ${productName} (${variantName}). Proceeding.`)
      }
      if (pricing.maxSellingPrice && sellingPrice > Number(pricing.maxSellingPrice)) {
        console.warn(`[updateOrderItems] Selling price ${sellingPrice} is above maximum ${pricing.maxSellingPrice} for ${productName} (${variantName}). Proceeding.`)
      }
    } else {
      costPrice = isAdjustment ? sellingPrice : 0
      if (!isAdjustment) {
        console.warn(`[updateOrderItems] WARNING: No pricing configured for ${productName} ${variantName}. Defaulting costPrice to 0.`)
      }
    }

    const qty = Number(itemInput.quantity || 0)
    const totalRevenue = sellingPrice * qty
    const totalCost = costPrice * qty
    const totalProfit = totalRevenue - totalCost

    totalAmount += totalRevenue

    // Legacy calculation for total_khakhra_kg if the category is Khakhra
    if (unitType === 'KG' && categoryName.toLowerCase().includes('khakhra')) {
      totalKhakhraKg += qty
    } else if (unitType === 'PACKET' && categoryName.toLowerCase().includes('khakhra')) {
      totalKhakhraKg += qty * 0.2 // rough estimate 200g per packet
    }

    return {
      orderId,
      variantId: variant?.id || itemInput.variantId,
      quantity: qty,
      productName,
      categoryName,
      variantName,
      unitCostPrice: costPrice,
      unitSellingPrice: sellingPrice,
      totalCost,
      totalRevenue,
      totalProfit,
    }
  })

  if (totalAmount <= 0 || orderItemsData.length === 0) {
    throw new Error("Order must have positive amount and items.")
  }

  // Update in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // 0. Fetch existing items to restore stock
    const existingItems = await tx.orderItem.findMany({
      where: { orderId }
    })

    // Restore stock for old items
    for (const item of existingItems) {
      if (item.variantId) {
        const inventory = await tx.inventoryLevel.findUnique({
          where: { variantId: item.variantId }
        })
        if (inventory) {
          await tx.inventoryLevel.update({
            where: { variantId: item.variantId },
            data: { availableStock: { increment: item.quantity } }
          })
        }
      }
    }

    // 1. Delete existing items
    await tx.orderItem.deleteMany({
      where: { orderId }
    })

    // 2. Create new items
    await tx.orderItem.createMany({
      data: orderItemsData
    })

    // Deduct stock for new items
    for (const item of orderItemsData) {
      const inventory = await tx.inventoryLevel.findUnique({
        where: { variantId: item.variantId }
      })
      if (inventory) {
        await tx.inventoryLevel.update({
          where: { variantId: item.variantId },
          data: { availableStock: { decrement: item.quantity } }
        })
      }
    }

    // 3. Update order totals
    const order = await tx.order.update({
      where: { id: orderId },
      data: {
        total_amount: totalAmount,
        total_khakhra_kg: totalKhakhraKg,
      },
      include: {
        items: {
          include: {
            variant: {
              include: { product: true }
            }
          }
        }
      }
    })

    return order
  })

  revalidateAllPaths(orderId)

  return serializePrisma(result)
}

export async function bulkUpdateOrderStatus(ids: string[], status: string) {
  console.log("[bulkUpdateOrderStatus] Updating IDs:", ids, "to status:", status)

  if (!ids || ids.length === 0) {
    throw new Error("No order IDs provided")
  }

  const result = await prisma.order.updateMany({
    where: { id: { in: ids } },
    data: { status }
  })

  // Sync invoice status with order status
  const lowerStatus = status.toLowerCase();
  if (lowerStatus === 'delivered' || lowerStatus === 'completed') {
    await prisma.invoice.updateMany({
      where: { orderId: { in: ids } },
      data: { paymentStatus: 'PAID' }
    });
  } else if (lowerStatus === 'cancelled') {
    await prisma.invoice.updateMany({
      where: { orderId: { in: ids } },
      data: { paymentStatus: 'CANCELLED' }
    });
  } else {
    // For pending, confirmed, processing, etc.
    await prisma.invoice.updateMany({
      where: { orderId: { in: ids } },
      data: { paymentStatus: 'PENDING' }
    });
  }

  ids.forEach(id => {
    revalidatePath(`/orders/${id}`)
    revalidatePath(`/orders/${id}/edit`)
  })
  revalidatePath("/orders")
  revalidatePath("/")
  revalidatePath("/summary")
  revalidatePath("/invoices") // Revalidate invoices as well

  return result.count
}

export async function bulkDeleteOrders(ids: string[]) {
  console.log("[bulkDeleteOrders] Deleting IDs:", ids)

  if (!ids || ids.length === 0) {
    throw new Error("No order IDs provided")
  }

  // Run in a transaction
  const count = await prisma.$transaction(async (tx) => {
    let deletedCount = 0

    for (const id of ids) {
      const order = await tx.order.findUnique({
        where: { id },
        include: {
          items: true,
          customer: true,
        }
      })

      if (order) {
        // Restore stock and write to ledger for each item
        for (const item of order.items) {
          const inventory = await tx.inventoryLevel.findUnique({
            where: { variantId: item.variantId }
          })

          if (inventory) {
            const updatedInventory = await tx.inventoryLevel.update({
              where: { variantId: item.variantId },
              data: { availableStock: { increment: item.quantity } }
            })

            await tx.stockLedger.create({
              data: {
                variantId: item.variantId,
                action: "RETURN_RECEIVED",
                quantity: item.quantity,
                previousStock: inventory.availableStock,
                newStock: updatedInventory.availableStock,
                reference: order.id,
                notes: `Order #${order.id.slice(0, 8).toUpperCase()} deleted (Bulk). Restoring stock.`
              }
            })
          }
        }

        // Decrement customer totalOrders count
        if (order.customer) {
          await tx.customer.update({
            where: { id: order.customerId },
            data: {
              totalOrders: { decrement: 1 }
            }
          })
        }

        // Delete the order
        await tx.order.delete({
          where: { id }
        })
        deletedCount++
      }
    }

    return deletedCount
  })

  // Revalidate paths
  ids.forEach(id => {
    revalidatePath(`/orders/${id}`)
    revalidatePath(`/orders/${id}/edit`)
  })
  revalidateAllPaths()

  return count
}
