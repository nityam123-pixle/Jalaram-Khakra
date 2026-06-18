"use server"

import { prisma } from "../../lib/prisma"
import { revalidatePath } from "next/cache"
import { serializePrisma } from "../../lib/prisma-serializer"

function revalidateAllPaths(orderId?: string) {
  revalidatePath("/")
  revalidatePath("/summary")
  revalidatePath("/orders")
  if (orderId) {
    revalidatePath(`/orders/${orderId}`)
    revalidatePath(`/orders/${orderId}/edit`)
  }
  revalidatePath("/inventory")
  revalidatePath("/inventory/current")
  revalidatePath("/inventory/ledger")
  revalidatePath("/inventory/movements")
  revalidatePath("/inventory/low-stock")
  revalidatePath("/inventory/settings")
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
}

export async function createOrder(data: CreateOrderInput) {
  console.log("[createOrder] Incoming request for customer:", data.customerId)
  console.log("[createOrder] Items received:", JSON.stringify(data.items, null, 2))

  if (!data.customerId || !data.items || data.items.length === 0) {
    throw new Error("Missing customerId or items")
  }

  // First, fetch the pricing and product info for all submitted variants
  const variantIds = data.items.map((i) => i.variantId)
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

  const orderItemsData = data.items.map((itemInput) => {
    const variant = variantMap.get(itemInput.variantId)
    if (!variant) throw new Error(`Variant ${itemInput.variantId} not found`)

    const pricing = variant.pricingRules[0]
    if (!pricing) throw new Error(`No pricing configured for ${variant.product.name} ${variant.name}`)

    const costPrice = Number(pricing.costPrice)
    const sellingPrice = itemInput.sellingPrice

    // Basic validation
    if (pricing.minSellingPrice && sellingPrice < Number(pricing.minSellingPrice)) {
      throw new Error(`Selling price ${sellingPrice} is below minimum ${pricing.minSellingPrice}`)
    }
    if (pricing.maxSellingPrice && sellingPrice > Number(pricing.maxSellingPrice)) {
      throw new Error(`Selling price ${sellingPrice} is above maximum ${pricing.maxSellingPrice}`)
    }

    const totalRevenue = sellingPrice * itemInput.quantity
    const totalCost = costPrice * itemInput.quantity
    const totalProfit = totalRevenue - totalCost

    totalAmount += totalRevenue
    
    // Legacy calculation for total_khakhra_kg if the category is Khakhra
    if (variant.unitType === 'KG' && variant.product.category.name.toLowerCase().includes('khakhra')) {
      totalKhakhraKg += itemInput.quantity
    } else if (variant.unitType === 'PACKET' && variant.product.category.name.toLowerCase().includes('khakhra')) {
      totalKhakhraKg += itemInput.quantity * 0.2 // rough estimate 200g per packet
    }

    return {
      variantId: variant.id,
      quantity: itemInput.quantity,
      productName: variant.product.name,
      categoryName: variant.product.category.name,
      variantName: variant.name,
      unitCostPrice: costPrice,
      unitSellingPrice: sellingPrice,
      totalCost,
      totalRevenue,
      totalProfit,
    }
  })

  console.log("[createOrder] Calculated Totals:", { totalAmount, totalKhakhraKg, itemCount: orderItemsData.length })

  if (totalAmount <= 0 || orderItemsData.length === 0) {
    throw new Error("At least one valid item with a positive revenue is required to create an order.")
  }

  // Start transaction
  const result = await prisma.$transaction(async (tx) => {
    // Get customer to copy snapshot fields
    const customer = await tx.customer.findUnique({
      where: { id: data.customerId }
    })
    
    if (!customer) throw new Error("Customer not found")

    // Update customer lastOrderAt and totalOrders
    await tx.customer.update({
      where: { id: customer.id },
      data: {
        lastOrderAt: new Date(),
        totalOrders: { increment: 1 }
      }
    })

    // Create the Order
    const order = await tx.order.create({
      data: {
        customerId: customer.id,
        shop_name: customer.shop_name,
        city: customer.city,
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

    // Update inventory for tracked variants
    for (const item of orderItemsData) {
      const inventory = await tx.inventoryLevel.findUnique({
        where: { variantId: item.variantId }
      })

      if (inventory) {
        const updatedInventory = await tx.inventoryLevel.update({
          where: { variantId: item.variantId },
          data: { availableStock: { decrement: item.quantity } }
        })

        await tx.stockLedger.create({
          data: {
            variantId: item.variantId,
            action: "SOLD_THROUGH_ORDER",
            quantity: -item.quantity,
            previousStock: inventory.availableStock,
            newStock: updatedInventory.availableStock,
            reference: order.id,
            notes: `Order #${order.id.slice(0,8)} created for ${customer.shop_name}`
          }
        })
      }
    }

    console.log("[createOrder] Order created successfully:", order.id)
    return order
  })

  revalidateAllPaths()
  
  return serializePrisma(result)
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
    if (filters.date) {
      const dateStart = new Date(filters.date);
      dateStart.setUTCHours(0, 0, 0, 0);
      const dateEnd = new Date(filters.date);
      dateEnd.setUTCHours(23, 59, 59, 999);
      where.created_at = { gte: dateStart, lte: dateEnd };
    }
    if (filters.product && filters.product !== "all") {
      where.items = {
        some: {
          variantId: filters.product
        }
      };
    }
    if (filters.search) {
      where.OR = [
        { shop_name: { contains: filters.search, mode: "insensitive" } },
        { city: { contains: filters.search, mode: "insensitive" } },
        { id: { contains: filters.search, mode: "insensitive" } },
        { customer: { shop_name: { contains: filters.search, mode: "insensitive" } } },
      ];
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
    customersCount,
    citiesQuery,
    cityGroup,
    ordersThisMonth
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: { equals: "pending", mode: "insensitive" } } }),
    prisma.order.count({ where: { status: { in: ["completed", "delivered"], mode: "insensitive" } } }),
    prisma.order.aggregate({ _sum: { total_amount: true } }),
    prisma.customer.count(),
    prisma.order.findMany({ select: { city: true }, distinct: ['city'] }),
    prisma.order.groupBy({
      by: ['city'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 1
    }),
    prisma.order.count({ where: { created_at: { gte: startOfMonth } } })
  ]);

  const totalRevenue = Number(revenueResult._sum.total_amount || 0);

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
    topProduct: "N/A", // Simplifying, as top product by quantity across millions of items is a heavy query
    repeatPercent: 0 // Simplifying for now
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
  const variantIds = items.map(i => i.variantId)
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
    if (!variant) throw new Error(`Variant ${itemInput.variantId} not found`)

    const pricing = variant.pricingRules[0]
    if (!pricing) throw new Error(`No pricing configured for ${variant.product.name} ${variant.name}`)

    const costPrice = Number(pricing.costPrice)
    const sellingPrice = itemInput.sellingPrice

    // Basic validation
    if (pricing.minSellingPrice && sellingPrice < Number(pricing.minSellingPrice)) {
      throw new Error(`Selling price ${sellingPrice} is below minimum ${pricing.minSellingPrice}`)
    }
    if (pricing.maxSellingPrice && sellingPrice > Number(pricing.maxSellingPrice)) {
      throw new Error(`Selling price ${sellingPrice} is above maximum ${pricing.maxSellingPrice}`)
    }

    const totalRevenue = sellingPrice * itemInput.quantity
    const totalCost = costPrice * itemInput.quantity
    const totalProfit = totalRevenue - totalCost

    totalAmount += totalRevenue

    // Legacy calculation for total_khakhra_kg if the category is Khakhra
    if (variant.unitType === 'KG' && variant.product.category.name.toLowerCase().includes('khakhra')) {
      totalKhakhraKg += itemInput.quantity
    } else if (variant.unitType === 'PACKET' && variant.product.category.name.toLowerCase().includes('khakhra')) {
      totalKhakhraKg += itemInput.quantity * 0.2 // rough estimate 200g per packet
    }

    return {
      orderId,
      variantId: variant.id,
      quantity: itemInput.quantity,
      productName: variant.product.name,
      categoryName: variant.product.category.name,
      variantName: variant.name,
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

  ids.forEach(id => {
    revalidatePath(`/orders/${id}`)
    revalidatePath(`/orders/${id}/edit`)
  })
  revalidatePath("/orders")
  revalidatePath("/")
  revalidatePath("/summary")

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
