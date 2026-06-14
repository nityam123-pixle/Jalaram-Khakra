import { prisma } from "../lib/prisma"

async function main() {
  const orderItems = await prisma.orderItem.findMany()
  
  const currentDbStats = orderItems.reduce((acc, item) => {
    let cat = item.categoryName
    if (cat === "Snacks" || item.variantName.includes("Sejwan")) cat = "Snacks"
    if (!acc[cat]) acc[cat] = { revenue: 0, units: 0 }
    acc[cat].revenue += item.totalRevenue
    acc[cat].units += item.quantity
    return acc
  }, {} as Record<string, { revenue: number, units: number }>)

  // Let's hardcode the historical stats from final-historical-report.ts
  const historicalStats: Record<string, { revenue: number, units: number }> = {
    "Khakhra": { "revenue": 320866, "units": 1578 },
    "Premium Khakhra": { "revenue": 14954.5, "units": 75.5 },
    "Bhakhri": { "revenue": 27825, "units": 530 },
    "Fulvadi": { "revenue": 6660, "units": 74 },
    "Mathiya Puri": { "revenue": 1975, "units": 42 },
    "Farali": { "revenue": 12915, "units": 258 },
    "Bhakarwadi": { "revenue": 28420, "units": 162 },
    "Snacks": { "revenue": 65252, "units": 612 }
  }

  console.log("=== CATEGORY COMPARISON (Legacy True vs Current DB OrderItems) ===")
  for (const cat of Object.keys(historicalStats)) {
    const histRev = historicalStats[cat].revenue
    const dbRev = currentDbStats[cat]?.revenue || 0
    const diff = dbRev - histRev
    if (Math.abs(diff) > 0.01) {
      console.log(`\nCategory: ${cat}`)
      console.log(`  Historical Script Revenue: ₹${histRev.toFixed(2)}`)
      console.log(`  Current DB Revenue: ₹${dbRev.toFixed(2)}`)
      console.log(`  Difference: +₹${diff.toFixed(2)}`)
      
      const histUnits = historicalStats[cat].units
      const dbUnits = currentDbStats[cat]?.units || 0
      console.log(`  Units Diff: DB has ${dbUnits - histUnits} more units`)
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
