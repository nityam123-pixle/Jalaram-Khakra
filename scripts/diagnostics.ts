import { prisma } from "../lib/prisma"

async function main() {
  const finalItems = await prisma.orderItem.findMany()

  const categoryStats = finalItems.reduce((acc, item) => {
    let cat = item.categoryName
    if (cat === "Snacks" || item.variantName.includes("Sejwan")) cat = "Snacks"
    if (!acc[cat]) acc[cat] = { revenue: 0, profit: 0, units: 0 }
    acc[cat].revenue += item.totalRevenue
    acc[cat].profit += item.totalProfit
    acc[cat].units += item.quantity
    return acc
  }, {} as Record<string, { revenue: number, profit: number, units: number }>)

  // Let's hardcode the expected historical profits from final-historical-report.ts
  const historicalStats: Record<string, { profit: number }> = {
    "Khakhra": { profit: 40190.50 },
    "Premium Khakhra": { profit: 1673.50 },
    "Bhakhri": { profit: 6625 },
    "Fulvadi": { profit: 740 },
    "Mathiya Puri": { profit: 85 },
    "Farali": { profit: 1548 },
    "Bhakarwadi": { profit: 5346 },
    "Snacks": { profit: 9221.60 }, // This is the corrected sejwan profit!
    "Patra": { profit: 65235.50 },
    "Chikki": { profit: 2582 } // User said Chikki profit is 2582!
  }

  // But wait, the user's expected profit was 131,696.30.
  // Wait, let's sum my historicalStats profit:
  // 40190.50 + 1673.50 + 6625 + 740 + 85 + 1548 + 5346 + 9221.60 + 65235.50 + 2582
  // = 133,247.10 ?? No, wait.
  // In `final_historical_accounting.md`, Total Profit was 130,982.70.
  // Old Sejwan Profit was 8,508.
  // 130982.70 - 8508 = 122474.70
  // 122474.70 + 9221.60 = 131696.30 (Matches the user's expected target perfectly!).

  let expectedTotal = 0
  let actualTotal = 0

  console.log("=== CATEGORY PROFIT DIAGNOSTICS ===")
  for (const cat of Object.keys(historicalStats)) {
    const expected = historicalStats[cat].profit
    const actual = categoryStats[cat]?.profit || 0
    const diff = actual - expected
    
    expectedTotal += expected
    actualTotal += actual

    if (Math.abs(diff) > 0.01) {
      console.log(`\nCategory: ${cat}`)
      console.log(`  Expected Profit: ₹${expected.toFixed(2)}`)
      console.log(`  Actual DB Profit: ₹${actual.toFixed(2)}`)
      console.log(`  Difference: +₹${diff.toFixed(2)}`)
    }
  }

  console.log(`\nOverall Expected: ₹${expectedTotal.toFixed(2)}`)
  console.log(`Overall Actual: ₹${actualTotal.toFixed(2)}`)
  console.log(`Net Divergence: ₹${(actualTotal - expectedTotal).toFixed(2)}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
