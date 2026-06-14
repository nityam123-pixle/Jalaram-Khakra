import { prisma } from "../lib/prisma"

async function main() {
  const orders = await prisma.order.findMany()
  const legacyItems = await prisma.khakhraItem.findMany()
  const orderItems = await prisma.orderItem.findMany()

  // 1. Current State
  const currentRevenue = orderItems.reduce((sum, item) => sum + item.totalRevenue, 0)
  const currentProfit = orderItems.reduce((sum, item) => sum + item.totalProfit, 0)
  
  const currentCounts = {
    total: orderItems.length,
    patra: orderItems.filter(i => i.categoryName === 'Patra').length,
    chikki: orderItems.filter(i => i.categoryName === 'Chikki').length,
    sejwan: orderItems.filter(i => i.categoryName === 'Snacks' || i.variantName.includes('Sejwan')).length,
    khakhra: orderItems.filter(i => i.categoryName === 'Khakhra').length,
  }

  // 2. Expected Patra to Migrate
  let expectedPatraToMigrate = 0
  for (const o of orders) {
    if (o.wants_patra && o.patra_packets && o.patra_packets > 0) {
      expectedPatraToMigrate++
    }
  }

  // 3. Expected Chikki to Migrate
  let expectedChikkiToMigrate = 0
  for (const o of orders) {
    if (o.wants_chikki && o.chikki_packets && o.chikki_packets > 0) {
      expectedChikkiToMigrate++
    }
  }

  // 4. Expected Rows to Update (Khakhra & Sejwan)
  // Any existing OrderItem that is Khakhra or Sejwan will be recalculated.
  const expectedKhakhraToUpdate = currentCounts.khakhra
  const expectedSejwanToUpdate = currentCounts.sejwan

  // Expected Revenue / Profit Target
  const targetRevenue = 949177.50
  const targetProfit = 131696.30

  console.log("=== DRY RUN RECONCILIATION ===")
  console.log("\n[CURRENT STATE]")
  console.log(`Current Revenue: ₹${currentRevenue.toFixed(2)}`)
  console.log(`Current Profit: ₹${currentProfit.toFixed(2)}`)
  console.log(`Total OrderItems: ${currentCounts.total}`)
  console.log(`  - Patra: ${currentCounts.patra}`)
  console.log(`  - Chikki: ${currentCounts.chikki}`)
  console.log(`  - Sejwan: ${currentCounts.sejwan}`)
  console.log(`  - Khakhra: ${currentCounts.khakhra}`)

  console.log("\n[EXPECTED ROWS TO CREATE]")
  console.log(`Patra OrderItems: ${expectedPatraToMigrate}`)
  console.log(`Chikki OrderItems: ${expectedChikkiToMigrate}`)

  console.log("\n[EXPECTED ROWS TO UPDATE]")
  console.log(`Khakhra OrderItems: ${expectedKhakhraToUpdate}`)
  console.log(`Sejwan OrderItems: ${expectedSejwanToUpdate}`)

  console.log("\n[EXPECTED FINANCIAL CHANGES]")
  console.log(`Expected Revenue Change: +₹${(targetRevenue - currentRevenue).toFixed(2)}`)
  console.log(`Expected Profit Change: +₹${(targetProfit - currentProfit).toFixed(2)}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
