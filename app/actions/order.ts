"use server"

import { prisma } from "../../lib/prisma"
import { revalidatePath } from "next/cache"
import { serializePrisma } from "../../lib/prisma-serializer"

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
      pricingRules: true
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

    console.log("[createOrder] Order created successfully:", order.id)
    return order
  })

  revalidatePath("/")
  revalidatePath("/summary")
  
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
  revalidatePath(`/orders/${id}`)
  revalidatePath(`/orders/${id}/edit`)
  revalidatePath("/orders")
  return serializePrisma(order)
}

export async function deleteOrder(id: string) {
  await prisma.order.delete({
    where: { id }
  })
  revalidatePath("/orders")
}

export async function getAllOrders() {
  const orders = await prisma.order.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      customer: true,
      items: {
        include: {
          variant: {
            include: { product: true }
          }
        }
      }
    }
  })
  return serializePrisma(orders)
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
      pricingRules: true
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
    // 1. Delete existing items
    await tx.orderItem.deleteMany({
      where: { orderId }
    })

    // 2. Create new items
    await tx.orderItem.createMany({
      data: orderItemsData
    })

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

  revalidatePath(`/orders/${orderId}`)
  revalidatePath(`/orders/${orderId}/edit`)
  revalidatePath("/orders")
  revalidatePath("/")
  revalidatePath("/summary")

  return serializePrisma(result)
}
