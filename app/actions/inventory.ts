"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  PurchaseOrderStatus,
  ShipmentStatus,
  StockAction,
} from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// INVENTORY DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

export async function getInventoryDashboard() {
  const [
    inventoryLevels,
    suppliers,
    pendingShipments,
    pendingPOs,
    recentLedger,
    categoryInventory,
  ] = await Promise.all([
    prisma.inventoryLevel.findMany({
      include: {
        variant: {
          include: {
            product: { include: { category: true } },
            pricingRules: {
              where: { effectiveTo: null },
              orderBy: { effectiveFrom: "desc" },
              take: 1,
            },
          },
        },
      },
    }),
    prisma.supplier.findMany({ where: { isActive: true } }),
    prisma.incomingShipment.findMany({
      where: { status: { in: ["PENDING", "IN_TRANSIT", "ARRIVED", "RECEIVING"] } },
      include: { supplier: true },
    }),
    prisma.purchaseOrder.findMany({
      where: { status: { in: ["DRAFT", "ORDERED", "IN_TRANSIT"] } },
      include: { supplier: true },
    }),
    prisma.stockLedger.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        variant: { include: { product: { include: { category: true } } } },
      },
    }),
    prisma.productCategory.findMany({
      include: {
        products: {
          include: {
            variants: { include: { inventory: true, pricingRules: { where: { effectiveTo: null }, take: 1 } } },
          },
        },
      },
    }),
  ]);

  // KPI calculations
  let totalInventoryValue = 0;
  let totalUnitsInStock = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  for (const level of inventoryLevels) {
    const costPrice = level.variant.pricingRules[0]?.costPrice ?? 0;
    totalInventoryValue += level.availableStock * costPrice;
    totalUnitsInStock += level.availableStock;
    if (level.availableStock === 0) outOfStockCount++;
    else if (level.availableStock <= level.reorderPoint) lowStockCount++;
  }

  // Monthly consumption (stock out in last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const monthlyConsumption = await prisma.stockLedger.aggregate({
    where: {
      action: "SOLD_THROUGH_ORDER",
      createdAt: { gte: thirtyDaysAgo },
    },
    _sum: { quantity: true },
  });

  // Category breakdown
  const categoryBreakdown = categoryInventory.map((cat) => {
    let value = 0;
    let units = 0;
    for (const product of cat.products) {
      for (const variant of product.variants) {
        const stock = variant.inventory?.availableStock ?? 0;
        const cost = variant.pricingRules[0]?.costPrice ?? 0;
        value += stock * cost;
        units += stock;
      }
    }
    return { name: cat.name, value, units };
  }).filter((c) => c.units > 0);

  // Incoming inventory value estimate from pending POs
  const pendingPOValue = pendingPOs.reduce(
    (sum, po) => sum + (po.invoiceAmount ?? 0),
    0
  );

  return {
    kpis: {
      totalInventoryValue,
      totalUnitsInStock,
      lowStockCount,
      outOfStockCount,
      pendingDeliveries: pendingShipments.length,
      incomingValue: pendingPOValue,
      monthlyConsumption: Math.abs(monthlyConsumption._sum.quantity ?? 0),
      activeSuppliers: suppliers.length,
      pendingPOCount: pendingPOs.length,
    },
    recentLedger,
    categoryBreakdown,
    pendingShipments,
    pendingPOs,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CURRENT INVENTORY
// ─────────────────────────────────────────────────────────────────────────────

export async function getCurrentInventory() {
  const levels = await prisma.inventoryLevel.findMany({
    include: {
      variant: {
        include: {
          product: { include: { category: true } },
          pricingRules: {
            where: { effectiveTo: null },
            orderBy: { effectiveFrom: "desc" },
            take: 1,
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return levels.map((level) => {
    const costPrice = level.variant.pricingRules[0]?.costPrice ?? 0;
    const inventoryValue = level.availableStock * costPrice;
    let status: "HEALTHY" | "LOW_STOCK" | "OUT_OF_STOCK" | "OVERSTOCKED";
    if (level.availableStock === 0) status = "OUT_OF_STOCK";
    else if (level.availableStock <= level.reorderPoint) status = "LOW_STOCK";
    else if (level.availableStock > level.reorderPoint * 5) status = "OVERSTOCKED";
    else status = "HEALTHY";

    return { ...level, inventoryValue, status, costPrice };
  });
}

export async function adjustStock(
  variantId: string,
  adjustment: number,
  notes: string
) {
  const level = await prisma.inventoryLevel.findUnique({ where: { variantId } });
  if (!level) throw new Error("Inventory level not found");

  const previousStock = level.availableStock;
  const newStock = Math.max(0, previousStock + adjustment);

  await prisma.$transaction([
    prisma.inventoryLevel.update({
      where: { variantId },
      data: { availableStock: newStock },
    }),
    prisma.stockLedger.create({
      data: {
        variantId,
        action: "MANUAL_ADJUSTMENT",
        quantity: adjustment,
        previousStock,
        newStock,
        notes,
      },
    }),
  ]);

  revalidatePath("/inventory");
  revalidatePath("/inventory/current");
  revalidatePath("/inventory/ledger");
}

export async function updateReorderPoint(variantId: string, reorderPoint: number) {
  await prisma.inventoryLevel.update({
    where: { variantId },
    data: { reorderPoint },
  });
  revalidatePath("/inventory/current");
  revalidatePath("/inventory/low-stock");
  revalidatePath("/inventory/settings");
}

// ─────────────────────────────────────────────────────────────────────────────
// SUPPLIERS
// ─────────────────────────────────────────────────────────────────────────────

export async function getSuppliers() {
  const suppliers = await prisma.supplier.findMany({
    include: {
      purchaseOrders: {
        include: { items: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return suppliers.map((s) => {
    const totalPurchases = s.purchaseOrders
      .filter((po) => po.status === "RECEIVED")
      .reduce((sum, po) => sum + (po.invoiceAmount ?? 0), 0);
    const outstandingOrders = s.purchaseOrders.filter(
      (po) => !["RECEIVED", "CANCELLED"].includes(po.status)
    ).length;
    const lastOrderDate =
      s.purchaseOrders.length > 0
        ? s.purchaseOrders.sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
          )[0].createdAt
        : null;

    return { ...s, totalPurchases, outstandingOrders, lastOrderDate };
  });
}

export async function getSupplierDetail(id: string) {
  const supplier = await prisma.supplier.findUniqueOrThrow({
    where: { id },
    include: {
      purchaseOrders: {
        include: {
          items: {
            include: { variant: { include: { product: { include: { category: true } } } } },
          },
          shipments: true,
        },
        orderBy: { createdAt: "desc" },
      },
      incomingShipments: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  const receivedPOs = supplier.purchaseOrders.filter((po) => po.status === "RECEIVED");
  const totalPurchases = receivedPOs.reduce((s, po) => s + (po.invoiceAmount ?? 0), 0);
  const outstandingOrders = supplier.purchaseOrders.filter(
    (po) => !["RECEIVED", "CANCELLED"].includes(po.status)
  ).length;

  // Delivery performance
  const deliveredShipments = supplier.incomingShipments.filter(
    (s) => s.status === "COMPLETED" && s.actualArrival && s.expectedArrival
  );
  const onTime = deliveredShipments.filter(
    (s) => s.actualArrival! <= s.expectedArrival!
  ).length;
  const delayed = deliveredShipments.length - onTime;
  const avgDelayDays =
    deliveredShipments.length > 0
      ? deliveredShipments.reduce((sum, s) => {
          if (!s.actualArrival || !s.expectedArrival) return sum;
          const diff = Math.max(
            0,
            (s.actualArrival.getTime() - s.expectedArrival.getTime()) /
              (1000 * 60 * 60 * 24)
          );
          return sum + diff;
        }, 0) / deliveredShipments.length
      : 0;

  // Category contribution
  const categorySet = new Map<string, number>();
  for (const po of supplier.purchaseOrders) {
    for (const item of po.items) {
      const cat = item.variant.product.category.name;
      categorySet.set(cat, (categorySet.get(cat) ?? 0) + item.quantityOrdered);
    }
  }

  return {
    ...supplier,
    totalPurchases,
    outstandingOrders,
    deliveryPerformance: { onTime, delayed, total: deliveredShipments.length },
    avgDelayDays: Math.round(avgDelayDays * 10) / 10,
    categoryContribution: Array.from(categorySet.entries()).map(([name, qty]) => ({
      name,
      qty,
    })),
  };
}

export async function createSupplier(data: {
  name: string;
  phone?: string;
  whatsapp?: string;
  city?: string;
  address?: string;
  gstNumber?: string;
  notes?: string;
}) {
  const supplier = await prisma.supplier.create({ data });
  revalidatePath("/inventory/suppliers");
  return supplier;
}

export async function updateSupplier(
  id: string,
  data: {
    name?: string;
    phone?: string;
    whatsapp?: string;
    city?: string;
    address?: string;
    gstNumber?: string;
    notes?: string;
    isActive?: boolean;
  }
) {
  const supplier = await prisma.supplier.update({ where: { id }, data });
  revalidatePath("/inventory/suppliers");
  revalidatePath(`/inventory/suppliers/${id}`);
  return supplier;
}

// ─────────────────────────────────────────────────────────────────────────────
// PURCHASE ORDERS
// ─────────────────────────────────────────────────────────────────────────────

export async function getPurchaseOrders(status?: PurchaseOrderStatus) {
  return prisma.purchaseOrder.findMany({
    where: status ? { status } : undefined,
    include: {
      supplier: true,
      items: {
        include: {
          variant: { include: { product: { include: { category: true } } } },
        },
      },
      shipments: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPurchaseOrderDetail(id: string) {
  return prisma.purchaseOrder.findUniqueOrThrow({
    where: { id },
    include: {
      supplier: true,
      items: {
        include: {
          variant: {
            include: {
              product: { include: { category: true } },
              pricingRules: { where: { effectiveTo: null }, take: 1 },
            },
          },
        },
      },
      shipments: {
        include: {
          receivingLogs: {
            include: { variant: { include: { product: true } } },
          },
        },
      },
    },
  });
}

export async function createPurchaseOrder(data: {
  supplierId: string;
  expectedDelivery?: string;
  transportDetails?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  invoiceAmount?: number;
  notes?: string;
  items: Array<{
    variantId: string;
    quantityOrdered: number;
    unitCostPrice: number;
    notes?: string;
  }>;
}) {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const count = await prisma.purchaseOrder.count();
  const poNumber = `PO-${today}-${String(count + 1).padStart(3, "0")}`;

  const po = await prisma.purchaseOrder.create({
    data: {
      poNumber,
      supplierId: data.supplierId,
      status: "DRAFT",
      expectedDelivery: data.expectedDelivery
        ? new Date(data.expectedDelivery)
        : undefined,
      transportDetails: data.transportDetails,
      invoiceNumber: data.invoiceNumber,
      invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : undefined,
      invoiceAmount: data.invoiceAmount,
      notes: data.notes,
      items: {
        create: data.items.map((item) => ({
          variantId: item.variantId,
          quantityOrdered: item.quantityOrdered,
          unitCostPrice: item.unitCostPrice,
          notes: item.notes,
        })),
      },
    },
    include: { supplier: true, items: true },
  });

  revalidatePath("/inventory/purchase-orders");
  return po;
}

export async function updatePurchaseOrderStatus(
  id: string,
  status: PurchaseOrderStatus,
  additionalData?: {
    invoiceNumber?: string;
    invoiceDate?: string;
    invoiceAmount?: number;
    transportDetails?: string;
    notes?: string;
  }
) {
  const po = await prisma.purchaseOrder.update({
    where: { id },
    data: {
      status,
      ...(additionalData ?? {}),
      invoiceDate: additionalData?.invoiceDate
        ? new Date(additionalData.invoiceDate)
        : undefined,
    },
  });
  revalidatePath("/inventory/purchase-orders");
  revalidatePath("/inventory");
  return po;
}

export async function updatePurchaseOrder(
  id: string,
  data: {
    supplierId?: string;
    expectedDelivery?: string;
    transportDetails?: string;
    invoiceNumber?: string;
    invoiceDate?: string;
    invoiceAmount?: number;
    notes?: string;
  }
) {
  const po = await prisma.purchaseOrder.update({
    where: { id },
    data: {
      ...data,
      expectedDelivery: data.expectedDelivery
        ? new Date(data.expectedDelivery)
        : undefined,
      invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : undefined,
    },
  });
  revalidatePath("/inventory/purchase-orders");
  return po;
}

// ─────────────────────────────────────────────────────────────────────────────
// INCOMING SHIPMENTS
// ─────────────────────────────────────────────────────────────────────────────

export async function getIncomingShipments(status?: ShipmentStatus) {
  return prisma.incomingShipment.findMany({
    where: status ? { status } : undefined,
    include: {
      supplier: true,
      purchaseOrder: {
        include: {
          items: {
            include: { variant: { include: { product: true } } },
          },
        },
      },
      receivingLogs: {
        include: { variant: { include: { product: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createShipment(data: {
  purchaseOrderId?: string;
  supplierId?: string;
  transportName?: string;
  vehicleNumber?: string;
  expectedArrival?: string;
  notes?: string;
}) {
  const count = await prisma.incomingShipment.count();
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const shipmentNumber = `SHP-${today}-${String(count + 1).padStart(3, "0")}`;

  const shipment = await prisma.incomingShipment.create({
    data: {
      shipmentNumber,
      purchaseOrderId: data.purchaseOrderId || null,
      supplierId: data.supplierId || null,
      transportName: data.transportName,
      vehicleNumber: data.vehicleNumber,
      expectedArrival: data.expectedArrival
        ? new Date(data.expectedArrival)
        : undefined,
      status: "PENDING",
      notes: data.notes,
    },
    include: { supplier: true, purchaseOrder: true },
  });

  // Update PO status to IN_TRANSIT
  if (data.purchaseOrderId) {
    await prisma.purchaseOrder.update({
      where: { id: data.purchaseOrderId },
      data: { status: "IN_TRANSIT" },
    });
  }

  revalidatePath("/inventory/incoming");
  revalidatePath("/inventory/purchase-orders");
  return shipment;
}

export async function updateShipmentStatus(id: string, status: ShipmentStatus) {
  const shipment = await prisma.incomingShipment.update({
    where: { id },
    data: {
      status,
      actualArrival: status === "ARRIVED" ? new Date() : undefined,
    },
  });
  revalidatePath("/inventory/incoming");
  return shipment;
}

export async function receiveStock(
  shipmentId: string,
  receivingData: Array<{
    variantId: string;
    quantityExpected: number;
    quantityReceived: number;
    quantityDamaged: number;
    notes?: string;
  }>
) {
  await prisma.$transaction(async (tx) => {
    for (const item of receivingData) {
      let level = await tx.inventoryLevel.findUnique({
        where: { variantId: item.variantId },
      });

      if (!level) {
        level = await tx.inventoryLevel.create({
          data: {
            variantId: item.variantId,
            availableStock: 0,
            reservedStock: 0,
            reorderPoint: 10,
          },
        });
      }

      const netReceived = item.quantityReceived - item.quantityDamaged;
      const previousStock = level.availableStock;
      const newStock = previousStock + netReceived;

      await tx.inventoryLevel.update({
        where: { variantId: item.variantId },
        data: { availableStock: newStock },
      });

      await tx.stockLedger.create({
        data: {
          variantId: item.variantId,
          action: "RECEIVED_FROM_SUPPLIER",
          reference: shipmentId,
          quantity: netReceived,
          previousStock,
          newStock,
          notes: item.notes,
        },
      });

      if (item.quantityDamaged > 0) {
        const damagedPrev = previousStock + item.quantityReceived;
        const damagedNew = damagedPrev - item.quantityDamaged;
        await tx.stockLedger.create({
          data: {
            variantId: item.variantId,
            action: "DAMAGED",
            reference: shipmentId,
            quantity: -item.quantityDamaged,
            previousStock: damagedPrev,
            newStock: damagedNew,
            notes: `Damaged during receiving`,
          },
        });
      }

      await tx.stockReceivingLog.create({
        data: {
          shipmentId,
          variantId: item.variantId,
          quantityExpected: item.quantityExpected,
          quantityReceived: item.quantityReceived,
          quantityDamaged: item.quantityDamaged,
          notes: item.notes,
        },
      });

      // Update PO item received quantity
      const shipmentRecord = await tx.incomingShipment.findUnique({
        where: { id: shipmentId },
        select: { purchaseOrderId: true },
      });
      if (shipmentRecord?.purchaseOrderId) {
        await tx.purchaseOrderItem.updateMany({
          where: {
            variantId: item.variantId,
            purchaseOrderId: shipmentRecord.purchaseOrderId,
          },
          data: { quantityReceived: { increment: item.quantityReceived } },
        });
      }
    }

    // Mark shipment completed
    await tx.incomingShipment.update({
      where: { id: shipmentId },
      data: { status: "COMPLETED", actualArrival: new Date() },
    });

    // Update PO status
    const shipmentRecord = await tx.incomingShipment.findUnique({
      where: { id: shipmentId },
      select: { purchaseOrderId: true },
    });
    if (shipmentRecord?.purchaseOrderId) {
      const poItems = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId: shipmentRecord.purchaseOrderId },
      });
      const allReceived = poItems.every(
        (i) => i.quantityReceived >= i.quantityOrdered
      );
      const anyReceived = poItems.some((i) => i.quantityReceived > 0);
      await tx.purchaseOrder.update({
        where: { id: shipmentRecord.purchaseOrderId },
        data: {
          status: allReceived
            ? "RECEIVED"
            : anyReceived
            ? "PARTIALLY_RECEIVED"
            : undefined,
        },
      });
    }
  });

  revalidatePath("/inventory");
  revalidatePath("/inventory/incoming");
  revalidatePath("/inventory/current");
  revalidatePath("/inventory/ledger");
  revalidatePath("/inventory/purchase-orders");
}

// ─────────────────────────────────────────────────────────────────────────────
// STOCK LEDGER
// ─────────────────────────────────────────────────────────────────────────────

export async function getStockLedger(options?: {
  variantId?: string;
  action?: StockAction;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 50;
  const skip = (page - 1) * pageSize;

  const where = {
    ...(options?.variantId ? { variantId: options.variantId } : {}),
    ...(options?.action ? { action: options.action } : {}),
    ...(options?.from || options?.to
      ? {
          createdAt: {
            ...(options?.from ? { gte: new Date(options.from) } : {}),
            ...(options?.to ? { lte: new Date(options.to) } : {}),
          },
        }
      : {}),
  };

  const [entries, total] = await Promise.all([
    prisma.stockLedger.findMany({
      where,
      include: {
        variant: {
          include: { product: { include: { category: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.stockLedger.count({ where }),
  ]);

  return {
    entries,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LOW STOCK
// ─────────────────────────────────────────────────────────────────────────────

export async function getLowStockAlerts() {
  const levels = await prisma.inventoryLevel.findMany({
    include: {
      variant: {
        include: {
          product: { include: { category: true } },
          pricingRules: { where: { effectiveTo: null }, take: 1 },
        },
      },
    },
  });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const consumptionData = await prisma.stockLedger.groupBy({
    by: ["variantId"],
    where: {
      action: "SOLD_THROUGH_ORDER",
      createdAt: { gte: thirtyDaysAgo },
    },
    _sum: { quantity: true },
  });

  const consumptionMap = new Map(
    consumptionData.map((c) => [c.variantId, Math.abs(c._sum.quantity ?? 0)])
  );

  return levels
    .filter((l) => l.availableStock <= l.reorderPoint)
    .map((level) => {
      const dailyConsumption = (consumptionMap.get(level.variantId) ?? 0) / 30;
      const daysRemaining =
        dailyConsumption > 0
          ? Math.floor(level.availableStock / dailyConsumption)
          : null;
      const stockoutDate =
        daysRemaining !== null
          ? new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000)
          : null;
      const urgency: "CRITICAL" | "HIGH" | "MEDIUM" =
        level.availableStock === 0
          ? "CRITICAL"
          : daysRemaining !== null && daysRemaining <= 7
          ? "HIGH"
          : "MEDIUM";

      return {
        ...level,
        dailyConsumption,
        daysRemaining,
        stockoutDate,
        urgency,
      };
    })
    .sort((a, b) => {
      const urgencyOrder: Record<string, number> = {
        CRITICAL: 0,
        HIGH: 1,
        MEDIUM: 2,
      };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// INVENTORY SETTINGS
// ─────────────────────────────────────────────────────────────────────────────

export async function getInventorySettings() {
  return prisma.inventoryLevel.findMany({
    include: {
      variant: {
        include: { product: { include: { category: true } } },
      },
    },
    orderBy: { variant: { product: { category: { displayOrder: "asc" } } } },
  });
}

export async function toggleInventoryTracking(
  variantId: string,
  tracked: boolean
) {
  await prisma.$transaction(async (tx) => {
    await tx.productVariant.update({
      where: { id: variantId },
      data: { inventoryTracked: tracked },
    });
    if (tracked) {
      await tx.inventoryLevel.upsert({
        where: { variantId },
        create: {
          variantId,
          availableStock: 0,
          reservedStock: 0,
          reorderPoint: 10,
        },
        update: {},
      });
    }
  });
  revalidatePath("/inventory/settings");
  revalidatePath("/inventory/current");
}

// ─────────────────────────────────────────────────────────────────────────────
// INVENTORY ANALYTICS / REPORTS
// ─────────────────────────────────────────────────────────────────────────────

export async function getInventoryAnalytics() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [ledgerEntries, categoryInventory, suppliers] = await Promise.all([
    prisma.stockLedger.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      include: {
        variant: { include: { product: { include: { category: true } } } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.productCategory.findMany({
      include: {
        products: {
          include: {
            variants: {
              include: {
                inventory: true,
                pricingRules: { where: { effectiveTo: null }, take: 1 },
              },
            },
          },
        },
      },
    }),
    prisma.supplier.findMany({
      include: {
        purchaseOrders: { include: { items: true } },
        incomingShipments: true,
      },
    }),
  ]);

  // Group ledger by date for stock in/out chart
  const dailyMap = new Map<string, { stockIn: number; stockOut: number }>();
  for (const entry of ledgerEntries) {
    const date = entry.createdAt.toISOString().slice(0, 10);
    const existing = dailyMap.get(date) ?? { stockIn: 0, stockOut: 0 };
    if (entry.quantity > 0) existing.stockIn += entry.quantity;
    else existing.stockOut += Math.abs(entry.quantity);
    dailyMap.set(date, existing);
  }
  const stockInOutTrend = Array.from(dailyMap.entries()).map(
    ([date, data]) => ({ date, ...data })
  );

  // Top moving products
  const movingMap = new Map<string, number>();
  for (const entry of ledgerEntries) {
    if (entry.action === "SOLD_THROUGH_ORDER") {
      const key = entry.variantId;
      movingMap.set(key, (movingMap.get(key) ?? 0) + Math.abs(entry.quantity));
    }
  }
  const topMoving = Array.from(movingMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  const topMovingWithDetails = await Promise.all(
    topMoving.map(async ([variantId, qty]) => {
      const variant = await prisma.productVariant.findUnique({
        where: { id: variantId },
        include: { product: { include: { category: true } } },
      });
      return { variantId, qty, variant };
    })
  );

  // Category inventory value
  const categoryValues = categoryInventory.map((cat) => {
    let value = 0;
    let units = 0;
    for (const product of cat.products) {
      for (const variant of product.variants) {
        const stock = variant.inventory?.availableStock ?? 0;
        const cost = variant.pricingRules[0]?.costPrice ?? 0;
        value += stock * cost;
        units += stock;
      }
    }
    return { name: cat.name, value, units };
  });

  // Supplier performance
  const supplierPerformance = suppliers.map((s) => {
    const totalOrders = s.purchaseOrders.length;
    const completedOrders = s.purchaseOrders.filter(
      (po) => po.status === "RECEIVED"
    ).length;
    const totalValue = s.purchaseOrders
      .filter((po) => po.status === "RECEIVED")
      .reduce((sum, po) => sum + (po.invoiceAmount ?? 0), 0);
    return {
      id: s.id,
      name: s.name,
      totalOrders,
      completedOrders,
      totalValue,
      fulfillmentRate:
        totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
    };
  });

  return {
    stockInOutTrend,
    topMovingWithDetails,
    categoryValues,
    supplierPerformance,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT VARIANTS (for PO line items)
// ─────────────────────────────────────────────────────────────────────────────

export async function getProductVariants() {
  return prisma.productVariant.findMany({
    where: { isActive: true },
    include: {
      product: { include: { category: true } },
      pricingRules: {
        where: { effectiveTo: null },
        orderBy: { effectiveFrom: "desc" },
        take: 1,
      },
    },
    orderBy: [
      { product: { category: { displayOrder: "asc" } } },
      { product: { name: "asc" } },
      { name: "asc" },
    ],
  });
}
