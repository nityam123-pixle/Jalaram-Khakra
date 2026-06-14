"use server"

import { prisma } from "../../lib/prisma"
import { revalidatePath } from "next/cache"

export type OrderItemInput = {
  variantId: string
  quantity: number
  sellingPrice: number
}

export type CreateOrderInput = {
  shopName: string
  city: string
  address: string
  dueDate?: Date
  items: OrderItemInput[]
}

export async function createOrder(data: CreateOrderInput) {
  if (!data.shopName || !data.city || !data.items || data.items.length === 0) {
    throw new Error("Missing required fields or items")
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

  // Start transaction
  const result = await prisma.$transaction(async (tx) => {
    // Upsert customer if they don't exist
    await tx.customer.upsert({
      where: {
        shop_name_city: {
          shop_name: data.shopName,
          city: data.city,
        }
      },
      update: {
        address: data.address
      },
      create: {
        shop_name: data.shopName,
        city: data.city,
        address: data.address
      }
    })

    // Create the Order
    const order = await tx.order.create({
      data: {
        shop_name: data.shopName,
        city: data.city,
        address: data.address,
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

    return order
  })

  revalidatePath("/")
  revalidatePath("/summary")
  
  return result
}
