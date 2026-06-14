import { prisma } from "../lib/prisma"

// Get profit & cost logic from legacy
const { calculateOrderProfit, calculateOrderTotalAmount } = require("../lib/supabase")

async function main() {
  const orders = await prisma.order.findMany()
  const legacyItems = await prisma.khakhraItem.findMany()
  
  const legacyItemsByOrderId = legacyItems.reduce((acc, item) => {
    if (!acc[item.order_id]) acc[item.order_id] = []
    acc[item.order_id].push(item)
    return acc
  }, {} as any)

  // 1. Calculate Old System Totals
  let oldTotalRevenue = 0
  let oldTotalProfit = 0
  
  const oldCategoryProfit: Record<string, number> = {
    "Khakhra": 0,
    "Premium Khakhra": 0, // Not explicitly returned by calculateOrderProfit? Wait, let's check calculateOrderProfit.
    "Bhakhri": 0,
    "Patra": 0,
    "Fulvadi": 0,
    "Chikki": 0,
    "Mathiya Puri": 0,
    "Farali": 0,
    "Bhakarwadi": 0,
    "Snacks": 0 // Sejwan
  }

  for (const order of orders) {
    oldTotalRevenue += Number(order.total_amount)

    const legacyOrder = {
      ...order,
      khakhra_items: legacyItemsByOrderId[order.id] || []
    }

    const profits = calculateOrderProfit(legacyOrder)
    
    oldTotalProfit += profits.totalProfit
    
    // The legacy calculateOrderProfit returns specific fields:
    oldCategoryProfit["Khakhra"] += profits.khakhraProfit // Wait, in legacy, is Premium Khakhra separated?
    oldCategoryProfit["Bhakarwadi"] += profits.bhakarwadiProfit
    oldCategoryProfit["Bhakhri"] += profits.bhakriProfit
    oldCategoryProfit["Farali"] += profits.faraliProfit
    oldCategoryProfit["Mathiya Puri"] += profits.mathiyaPuriProfit
    oldCategoryProfit["Patra"] += profits.patraProfit
    oldCategoryProfit["Fulvadi"] += profits.fulvadiProfit
    oldCategoryProfit["Chikki"] += profits.chikkiProfit
    if (profits.sejwanProfit) {
      oldCategoryProfit["Snacks"] += profits.sejwanProfit
    }
  }

  // 2. Calculate New System Totals
  const orderItems = await prisma.orderItem.findMany()
  
  let newTotalRevenue = 0 // Wait, new system revenue is sum of item revenues? Or order.total_amount?
  let newTotalProfit = 0
  
  const newCategoryProfit: Record<string, number> = {
    "Khakhra": 0,
    "Premium Khakhra": 0,
    "Bhakhri": 0,
    "Patra": 0,
    "Fulvadi": 0,
    "Chikki": 0,
    "Mathiya Puri": 0,
    "Farali": 0,
    "Bhakarwadi": 0,
    "Snacks": 0
  }

  for (const item of orderItems) {
    newTotalRevenue += Number(item.totalRevenue)
    newTotalProfit += Number(item.totalProfit)
    
    const cat = item.categoryName
    if (newCategoryProfit[cat] !== undefined) {
      newCategoryProfit[cat] += Number(item.totalProfit)
    } else {
      newCategoryProfit[cat] = Number(item.totalProfit)
    }
  }

  // Print Report
  console.log("=========================================")
  console.log("ACCOUNTING VERIFICATION REPORT")
  console.log("=========================================\n")

  console.log(`TOTAL REVENUE:`)
  console.log(`OLD_VALUE:  ${oldTotalRevenue}`)
  console.log(`NEW_VALUE:  ${newTotalRevenue}`)
  console.log(`DIFFERENCE: ${newTotalRevenue - oldTotalRevenue}\n`)

  console.log(`TOTAL PROFIT:`)
  console.log(`OLD_VALUE:  ${oldTotalProfit}`)
  console.log(`NEW_VALUE:  ${newTotalProfit}`)
  console.log(`DIFFERENCE: ${newTotalProfit - oldTotalProfit}\n`)

  console.log("PROFIT BY CATEGORY:")
  console.log("-----------------------------------------")
  
  const allCategories = new Set([...Object.keys(oldCategoryProfit), ...Object.keys(newCategoryProfit)])
  
  for (const cat of allCategories) {
    let oldVal = oldCategoryProfit[cat] || 0
    let newVal = newCategoryProfit[cat] || 0
    
    // In legacy, regular and premium khakhra are combined into 'khakhraProfit'
    // Let's print them exactly as they are mapped in the old vs new.
    
    console.log(`Category: ${cat}`)
    console.log(`OLD_VALUE:  ${oldVal}`)
    console.log(`NEW_VALUE:  ${newVal}`)
    console.log(`DIFFERENCE: ${newVal - oldVal}`)
    console.log("-----------------------------------------")
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
