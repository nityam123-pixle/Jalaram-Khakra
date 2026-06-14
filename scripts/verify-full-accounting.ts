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
  const newStats = createStats()

  // 1. Old System
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
      const profitPerUnit = price - 55 // calculatePatraProfit
      oldStats['Patra'].revenue += price * order.patra_packets
      oldStats['Patra'].profit += profitPerUnit * order.patra_packets
      oldStats['Patra'].units += order.patra_packets
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
      const profitPerUnit = price - 30 // legacy
      oldStats['Chikki'].revenue += price * order.chikki_packets
      oldStats['Chikki'].profit += profitPerUnit * order.chikki_packets
      oldStats['Chikki'].units += order.chikki_packets
    }
  }

  // 2. New System
  const orderItems = await prisma.orderItem.findMany()
  
  for (const item of orderItems) {
    const cat = item.categoryName
    if (!newStats[cat]) newStats[cat] = { revenue: 0, profit: 0, units: 0 }
    
    newStats[cat].revenue += Number(item.totalRevenue)
    newStats[cat].profit += Number(item.totalProfit)
    newStats[cat].units += Number(item.quantity)
  }

  // Output
  const metrics = ['Revenue', 'Profit', 'Units']

  for (const metric of metrics) {
    console.log(`\n=========================================`)
    console.log(`${metric.toUpperCase()} BY CATEGORY`)
    console.log(`=========================================`)
    const key = metric.toLowerCase() as 'revenue' | 'profit' | 'units'

    for (const cat of categories) {
      const oldVal = oldStats[cat]?.[key] || 0
      const newVal = newStats[cat]?.[key] || 0
      const diff = newVal - oldVal

      // Rounding to 2 decimal places to avoid massive floats
      console.log(`Category: ${cat}`)
      console.log(`OLD_VALUE:  ${oldVal.toFixed(2)}`)
      console.log(`NEW_VALUE:  ${newVal.toFixed(2)}`)
      console.log(`DIFFERENCE: ${diff.toFixed(2)}`)
      console.log(`-----------------------------------------`)
    }
  } // <--- Added missing bracket here

  // Print Patra prices
  console.log("\n=========================================")
  console.log("PATRA PRICE HISTORY")
  console.log("=========================================")
  const patraPrices: Record<string, number> = {}
  for (const order of orders) {
    if (order.wants_patra && order.patra_packets) {
       const price = order.patra_price_per_packet || 75
       patraPrices[price] = (patraPrices[price] || 0) + order.patra_packets
    }
  }
  console.log("Buying Price (Cost): ₹67.75")
  console.log("Selling Prices used in history:")
  console.table(patraPrices)
}

main().catch(console.error).finally(() => prisma.$disconnect())
