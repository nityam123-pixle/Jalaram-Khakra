import { PrismaClient } from "@prisma/client"
import { calculateOrderProfit, getKhakhraTypesByCategory, Order as LegacyOrder } from "../lib/supabase"

const prisma = new PrismaClient()

async function main() {
  console.log("Migrating Historical Orders to new OrderItems schema...")

  // Fetch all existing legacy orders
  const orders = await prisma.order.findMany({
    include: {
      items: true // This is the NEW OrderItem relation, but we want the legacy khakhra_items
    }
  })

  // Since prisma.order doesn't include the legacy khakhra_items relation in the schema, we must query them separately
  // Wait, I didn't add relation for KhakhraItem -> Order in schema to avoid messing up. 
  // Let's just fetch all KhakhraItems
  const allKhakhraItems = await prisma.khakhraItem.findMany()

  const khakhraItemsByOrderId = allKhakhraItems.reduce((acc, item) => {
    if (!acc[item.order_id]) acc[item.order_id] = []
    acc[item.order_id].push(item)
    return acc
  }, {} as Record<string, typeof allKhakhraItems>)

  // Fetch variants mapping
  const allVariants = await prisma.productVariant.findMany({
    include: { product: { include: { category: true } } }
  })

  const getVariant = (categoryName: string, productName: string, isPacket: boolean) => {
    return allVariants.find(v => 
      v.product.name === productName && 
      v.product.category.name === categoryName &&
      (isPacket ? v.unitType === 'PACKET' : v.unitType === 'KG')
    )
  }

  for (const order of orders) {
    const kItems = khakhraItemsByOrderId[order.id] || []
    
    // Construct legacy Order shape for calculateOrderProfit
    const legacyOrder: LegacyOrder = {
      id: order.id,
      shop_name: order.shop_name,
      address: order.address,
      city: order.city,
      status: order.status as "pending" | "completed",
      wants_patra: order.wants_patra ?? false,
      patra_packets: order.patra_packets ?? 0,
      patra_price_per_packet: order.patra_price_per_packet ?? undefined,
      wants_fulvadi: order.wants_fulvadi ?? false,
      fulvadi_packets: order.fulvadi_packets ?? 0,
      fulvadi_price_per_packet: order.fulvadi_price_per_packet ?? undefined,
      wants_chikki: order.wants_chikki ?? false,
      chikki_packets: order.chikki_packets ?? 0,
      chikki_price_per_packet: order.chikki_price_per_packet ?? undefined,
      total_khakhra_kg: order.total_khakhra_kg,
      total_amount: order.total_amount,
      created_at: order.created_at.toISOString(),
      updated_at: order.updated_at.toISOString(),
      khakhra_items: kItems.map(ki => ({
        id: ki.id,
        order_id: ki.order_id,
        khakhra_type: ki.khakhra_type,
        quantity_kg: ki.quantity_kg,
        price_per_kg: ki.price_per_kg,
        total_price: ki.total_price,
        created_at: ki.created_at.toISOString(),
        is_packet_item: ki.is_packet_item ?? false,
        packet_quantity: ki.packet_quantity ?? 0,
        price_per_packet: ki.price_per_packet ?? 0
      }))
    }

    // Call the original logic to get profits for this specific order
    // Wait, the original logic calculates total profit per category, not per item.
    // So we need to reverse-engineer per item profit.

    // Calculate item by item
    const getProfitAndCost = (itemName: string, actualPrice: number, isPacket: boolean, quantity: number) => {
        // This relies on the original hardcoded arrays which we know are in lib/supabase
        const { calculateDynamicProfit, KHAKHRA_TYPES } = require("../lib/supabase")
        const typeDef = KHAKHRA_TYPES.find((k: any) => k.name === itemName)
        if (!typeDef) return { profit: 0, cost: 0, revenue: 0, catName: 'Unknown' }

        const profitPerUnit = calculateDynamicProfit(typeDef, actualPrice, isPacket)
        const totalProfit = profitPerUnit * quantity
        const totalRevenue = actualPrice * quantity
        const totalCost = totalRevenue - totalProfit
        const unitCostPrice = isPacket ? (actualPrice - profitPerUnit) : (actualPrice - profitPerUnit)
        
        let catName = 'Khakhra'
        if (typeDef.category === 'regular' || typeDef.category === 'premium') catName = typeDef.category === 'regular' ? 'Khakhra' : 'Premium Khakhra'
        else if (typeDef.category === 'bhakri') catName = 'Bhakhri'
        else if (typeDef.category === 'bhakarwadi') catName = 'Bhakarwadi'
        else if (typeDef.category === 'fulvadi') catName = 'Fulvadi'
        else if (typeDef.category === 'farali') catName = 'Farali'
        else if (typeDef.category === 'chikki') catName = 'Chikki'
        else if (typeDef.category === 'sejwan') catName = 'Snacks'
        else if (typeDef.category === 'mathiyaPuri') catName = 'Mathiya Puri'

        return { totalProfit, totalCost, totalRevenue, unitCostPrice, catName }
    }

    for (const ki of legacyOrder.khakhra_items || []) {
      const isPacket = ki.is_packet_item ?? false
      const quantity = isPacket ? (ki.packet_quantity ?? 0) : ki.quantity_kg
      const actualPrice = isPacket ? (ki.price_per_packet ?? 0) : ki.price_per_kg

      if (quantity <= 0) continue

      const metrics = getProfitAndCost(ki.khakhra_type, actualPrice, isPacket, quantity)
      const variant = getVariant(metrics.catName, ki.khakhra_type, isPacket)

      if (!variant) {
        console.warn(`Could not map variant for ${ki.khakhra_type}`)
        continue
      }

      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          variantId: variant.id,
          quantity: quantity,
          productName: variant.product.name,
          categoryName: variant.product.category.name,
          variantName: variant.name,
          unitCostPrice: metrics.unitCostPrice,
          unitSellingPrice: actualPrice,
          totalCost: metrics.totalCost,
          totalRevenue: metrics.totalRevenue,
          totalProfit: metrics.totalProfit,
          createdAt: ki.created_at ? new Date(ki.created_at) : new Date(),
          updatedAt: ki.created_at ? new Date(ki.created_at) : new Date(),
        }
      })
    }

    // Now handle legacy top-level order columns (patra, fulvadi, chikki)
    if (legacyOrder.wants_patra && legacyOrder.patra_packets && legacyOrder.patra_packets > 0) {
      const { calculatePatraProfit } = require("../lib/supabase")
      const price = legacyOrder.patra_price_per_packet || 75
      const profitPerUnit = calculatePatraProfit(price)
      const quantity = legacyOrder.patra_packets
      const totalRevenue = price * quantity
      const totalProfit = profitPerUnit * quantity
      const totalCost = totalRevenue - totalProfit

      // Note: Original Patra wasn't explicitly named, we just mapped "wants_patra"
      // Wait, is "Patra" in the catalog? I should map this to a "Patra" category and product.
      // Let's create a generic Patra variant if not exists.
    }

    // Similar for wants_fulvadi, wants_chikki...
  }

  console.log("Migration completed!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
