import { prisma } from "../lib/prisma"
const { calculateDynamicProfit, KHAKHRA_TYPES } = require("../lib/supabase")

async function main() {
  const orders = await prisma.order.findMany()
  const legacyItems = await prisma.khakhraItem.findMany()
  
  const legacyItemsByOrderId = legacyItems.reduce((acc, item) => {
    if (!acc[item.order_id]) acc[item.order_id] = []
    acc[item.order_id].push(item)
    return acc
  }, {} as any)

  const categories = [
    "Khakhra",
    "Premium Khakhra",
    "Bhakhri",
    "Patra",
    "Fulvadi",
    "Chikki",
    "Mathiya Puri",
    "Farali",
    "Bhakarwadi",
    "Snacks"
  ]

  const finalStats = categories.reduce((acc, cat) => {
    acc[cat] = { revenue: 0, profit: 0, units: 0 }
    return acc
  }, {} as Record<string, { revenue: number, profit: number, units: number }>)

  const PATRA_CUTOFF_DATE = new Date('2026-03-01T00:00:00.000Z')
  const KHAKHRA_CUTOFF_DATE = new Date('2026-03-27T00:00:00.000Z')

  for (const order of orders) {
    const kItems = legacyItemsByOrderId[order.id] || []
    
    // Process items array
    for (const item of kItems) {
      const typeDef = KHAKHRA_TYPES.find((k: any) => k.name === item.khakhra_type)
      if (!typeDef) continue

      let catName = 'Khakhra'
      if (typeDef.category === 'regular') catName = 'Khakhra'
      else if (typeDef.category === 'premium') catName = 'Premium Khakhra'
      else if (typeDef.category === 'bhakri') catName = 'Bhakhri'
      else if (typeDef.category === 'bhakarwadi') catName = 'Bhakarwadi'
      else if (typeDef.category === 'fulvadi') catName = 'Fulvadi'
      else if (typeDef.category === 'farali') catName = 'Farali'
      else if (typeDef.category === 'chikki') catName = 'Chikki'
      else if (typeDef.category === 'sejwan') catName = 'Snacks'
      else if (typeDef.category === 'mathiyaPuri') catName = 'Mathiya Puri'

      const isPacket = item.is_packet_item || false
      const quantity = Number(isPacket ? (item.packet_quantity || 0) : item.quantity_kg)
      const actualPrice = Number(isPacket ? (item.price_per_packet || 0) : item.price_per_kg)
      
      const revenue = actualPrice * quantity
      let profit = 0

      // Custom Khakhra rule
      if (catName === 'Khakhra') {
        const isPostCutoff = new Date(order.created_at) >= KHAKHRA_CUTOFF_DATE
        if (isPacket) {
          // Fall back to original logic for packet Khakhra
          const profitPerUnit = calculateDynamicProfit(typeDef, actualPrice, true)
          profit = profitPerUnit * quantity
        } else {
          const cost = isPostCutoff ? 195.00 : 174.90
          const profitPerUnit = actualPrice - cost
          profit = profitPerUnit * quantity
        }
      } else {
        // Standard rule for everything else
        const profitPerUnit = calculateDynamicProfit(typeDef, actualPrice, isPacket)
        profit = profitPerUnit * quantity
      }

      finalStats[catName].revenue += revenue
      finalStats[catName].profit += profit
      finalStats[catName].units += quantity
    }

    // Process top-level order columns
    if (order.wants_patra && order.patra_packets && order.patra_packets > 0) {
      const price = order.patra_price_per_packet || 75
      const isNewPricing = new Date(order.created_at) >= PATRA_CUTOFF_DATE
      const cost = isNewPricing ? 74.10 : 67.75
      
      const profitPerUnit = price - cost
      const totalProfitForOrder = profitPerUnit * order.patra_packets
      
      finalStats['Patra'].revenue += price * order.patra_packets
      finalStats['Patra'].profit += totalProfitForOrder
      finalStats['Patra'].units += order.patra_packets
    }

    if (order.wants_fulvadi && order.fulvadi_packets && order.fulvadi_packets > 0) {
      const price = order.fulvadi_price_per_packet || 90
      const profitPerUnit = price - 65 // legacy cost 65
      finalStats['Fulvadi'].revenue += price * order.fulvadi_packets
      finalStats['Fulvadi'].profit += profitPerUnit * order.fulvadi_packets
      finalStats['Fulvadi'].units += order.fulvadi_packets
    }

    if (order.wants_chikki && order.chikki_packets && order.chikki_packets > 0) {
      const price = order.chikki_price_per_packet || 40 // wait, chikki logic
      // Actually legacy logic defaults to 40? No, wait!
      // In old component: CHIKKI_PRICE_MIN was 40 maybe? Let's check calculateOrderProfit.
      // The user wants original Chikki logic. We found CHIKKI_COST_PER_PACKET = 27.
      const profitPerUnit = Math.max(price - 27, 0)
      finalStats['Chikki'].revenue += price * order.chikki_packets
      finalStats['Chikki'].profit += profitPerUnit * order.chikki_packets
      finalStats['Chikki'].units += order.chikki_packets
    }
  }

  // Calculate Totals
  const totalRevenue = Object.values(finalStats).reduce((sum, cat) => sum + cat.revenue, 0)
  const totalProfit = Object.values(finalStats).reduce((sum, cat) => sum + cat.profit, 0)

  // JSON Output to console
  console.log(JSON.stringify({
    totalRevenue,
    totalProfit,
    finalStats
  }, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
