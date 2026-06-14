import { prisma } from "../lib/prisma"

const getProfitAndCost = (itemName: string, actualPrice: number, isPacket: boolean, quantity: number) => {
    const { calculateDynamicProfit, KHAKHRA_TYPES } = require("../lib/supabase")
    const typeDef = KHAKHRA_TYPES.find((k: any) => k.name === itemName)
    if (!typeDef) return { profit: 0, cost: 0, revenue: 0, catName: 'Unknown', totalProfit: 0, totalCost: 0, totalRevenue: 0, unitCostPrice: 0 }

    const profitPerUnit = calculateDynamicProfit(typeDef, actualPrice, isPacket)
    const totalProfit = profitPerUnit * quantity
    const totalRevenue = actualPrice * quantity
    const totalCost = totalRevenue - totalProfit
    const unitCostPrice = actualPrice - profitPerUnit
    
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

async function main() {
  const allVariants = await prisma.productVariant.findMany({
    include: { product: { include: { category: true } } }
  })

  // 1. Auto-map 'Mathiya Puri Nani' -> 'Mathiya Puri Mini'
  const naniItems = await prisma.khakhraItem.findMany({ where: { khakhra_type: 'Mathiya Puri Nani' } })
  // For Mathiya Puri, the unit is PACKET. Let's find the PACKET variant of Mathiya Puri Mini.
  const naniVariant = allVariants.find(v => v.product.name === 'Mathiya Puri Mini' && v.unitType === 'PACKET')
  
  let migratedCount = 0;
  if (naniVariant) {
    for (const item of naniItems) {
      if (!item.order_id) continue;
      
      const existing = await prisma.orderItem.findFirst({
        where: { orderId: item.order_id, variantId: naniVariant.id }
      })
      
      if (!existing) {
        const isPacket = item.is_packet_item ?? false
        const quantity = isPacket ? (item.packet_quantity ?? 0) : item.quantity_kg
        const actualPrice = isPacket ? (item.price_per_packet ?? 0) : item.price_per_kg
        
        const metrics = getProfitAndCost('Mathiya Puri Nani', actualPrice, isPacket, quantity)
        const finalMetrics = metrics.catName === 'Unknown' ? getProfitAndCost('Mathiya Puri Mini', actualPrice, isPacket, quantity) : metrics

        await prisma.orderItem.create({
          data: {
            orderId: item.order_id,
            variantId: naniVariant.id,
            quantity: quantity,
            productName: naniVariant.product.name,
            categoryName: naniVariant.product.category.name,
            variantName: naniVariant.name,
            unitCostPrice: finalMetrics.unitCostPrice,
            unitSellingPrice: actualPrice,
            totalCost: finalMetrics.totalCost,
            totalRevenue: finalMetrics.totalRevenue,
            totalProfit: finalMetrics.totalProfit,
            createdAt: item.created_at ? new Date(item.created_at) : new Date(),
            updatedAt: item.created_at ? new Date(item.created_at) : new Date(),
          }
        })
        migratedCount++;
      }
    }
  }

  console.log(`Migrated ${migratedCount} rows for Mathiya Puri Nani.`)

  // 2. Investigate 'Tometo cheese'
  const tometoItems = await prisma.khakhraItem.findMany({ where: { khakhra_type: 'Tometo cheese' } })
  console.log("--- Tometo cheese investigation ---")
  const tometoVariant = allVariants.filter(v => v.product.name.toLowerCase() === 'tometo cheese')
  
  for (const item of tometoItems) {
    console.log(JSON.stringify({
      khakhra_type: item.khakhra_type,
      is_packet_item: item.is_packet_item,
      packet_quantity: item.packet_quantity,
      quantity_kg: item.quantity_kg,
      matching_ProductVariants: tometoVariant.map(v => ({
         product: v.product.name,
         variant: v.name,
         UnitType: v.unitType
      }))
    }, null, 2))
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
