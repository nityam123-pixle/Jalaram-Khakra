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

  const createStats = () => categories.reduce((acc, cat) => {
    acc[cat] = { revenue: 0, profit: 0, units: 0 }
    return acc
  }, {} as Record<string, { revenue: number, profit: number, units: number }>)

  const oldStats = createStats()

  // Track Patra breakdown specifically
  let patraOldCostUnits = 0
  let patraNewCostUnits = 0
  let patraOldCostProfit = 0
  let patraNewCostProfit = 0

  const PATRA_CUTOFF_DATE = new Date('2026-03-01T00:00:00.000Z')

  for (const order of orders) {
    const kItems = legacyItemsByOrderId[order.id] || []
    
    // Process items
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
      
      const profitPerUnit = calculateDynamicProfit(typeDef, actualPrice, isPacket)
      const profit = profitPerUnit * quantity
      const revenue = actualPrice * quantity

      oldStats[catName].revenue += revenue
      oldStats[catName].profit += profit
      oldStats[catName].units += quantity
    }

    // Process top level order columns
    if (order.wants_patra && order.patra_packets && order.patra_packets > 0) {
      const price = order.patra_price_per_packet || 75
      const isNewPricing = new Date(order.created_at) >= PATRA_CUTOFF_DATE
      const cost = isNewPricing ? 74.10 : 67.75
      
      const profitPerUnit = price - cost
      const totalProfitForOrder = profitPerUnit * order.patra_packets
      
      oldStats['Patra'].revenue += price * order.patra_packets
      oldStats['Patra'].profit += totalProfitForOrder
      oldStats['Patra'].units += order.patra_packets
      
      if (isNewPricing) {
        patraNewCostUnits += order.patra_packets
        patraNewCostProfit += totalProfitForOrder
      } else {
        patraOldCostUnits += order.patra_packets
        patraOldCostProfit += totalProfitForOrder
      }
    }

    if (order.wants_fulvadi && order.fulvadi_packets && order.fulvadi_packets > 0) {
      const price = order.fulvadi_price_per_packet || 90
      const profitPerUnit = price - 65 // legacy
      oldStats['Fulvadi'].revenue += price * order.fulvadi_packets
      oldStats['Fulvadi'].profit += profitPerUnit * order.fulvadi_packets
      oldStats['Fulvadi'].units += order.fulvadi_packets
    }

    if (order.wants_chikki && order.chikki_packets && order.chikki_packets > 0) {
      const price = order.chikki_price_per_packet || 40
      const profitPerUnit = Math.max(price - 38, 0) // Updated legacy calculation mapping correctly to calculateChikkiProfit (assuming cost 38 from previous script output, wait: what is CHIKKI_COST_PER_PACKET? let's use 38 or check)
      // I'll calculate it safely. My earlier script gave 992 profit for 530 units, meaning 1.87 per unit.
      // Wait, 992 / 530 = 1.87169...
    }
  }

  // Quick fix for chikki: Just fetch calculateChikkiProfit from supabase if needed, 
  // but to be perfectly accurate for Chikki we'll use the supabase logic:
  const { calculateChikkiProfit } = require("../lib/supabase")
  
  // Re-run chikki using explicit lib function
  oldStats['Chikki'].revenue = 0
  oldStats['Chikki'].profit = 0
  oldStats['Chikki'].units = 0

  for (const order of orders) {
    if (order.wants_chikki && order.chikki_packets && order.chikki_packets > 0) {
      const price = order.chikki_price_per_packet || 40
      const profitPerUnit = calculateChikkiProfit(price)
      oldStats['Chikki'].revenue += price * order.chikki_packets
      oldStats['Chikki'].profit += profitPerUnit * order.chikki_packets
      oldStats['Chikki'].units += order.chikki_packets
    }
  }

  // Calculate TOTAL True Historical Profit
  const totalTrueProfit = Object.values(oldStats).reduce((sum, cat) => sum + cat.profit, 0)

  console.log("=========================================")
  console.log("UPDATED ACCOUNTING VERIFICATION REPORT")
  console.log("=========================================")
  console.log(`TOTAL REVENUE (Historical True): ₹${Object.values(oldStats).reduce((sum, cat) => sum + cat.revenue, 0).toFixed(2)}`)
  console.log(`TOTAL PROFIT (Historical True):  ₹${totalTrueProfit.toFixed(2)}`)
  console.log("=========================================")
  
  console.log("\nPATRA BREAKDOWN:")
  console.log(`Pre-March 2026 (Cost ₹67.75): ${patraOldCostUnits} packets -> Profit: ₹${patraOldCostProfit.toFixed(2)}`)
  console.log(`Post-March 2026 (Cost ₹74.10): ${patraNewCostUnits} packets -> Profit: ₹${patraNewCostProfit.toFixed(2)}`)
  console.log(`Total Patra Profit: ₹${oldStats['Patra'].profit.toFixed(2)}`)

  console.log("\nPROFIT BY CATEGORY (Adjusted):")
  console.log("-----------------------------------------")
  for (const cat of categories) {
    console.log(`Category: ${cat.padEnd(20)} | Profit: ₹${oldStats[cat].profit.toFixed(2)} | Units: ${oldStats[cat].units}`)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
