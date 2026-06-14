import { prisma } from "../lib/prisma"
import * as fs from "fs"

async function main() {
  const finalItems = await prisma.orderItem.findMany()

  const finalRevenue = finalItems.reduce((sum, item) => sum + item.totalRevenue, 0)
  const finalProfit = finalItems.reduce((sum, item) => sum + item.totalProfit, 0)

  const categoryStats = finalItems.reduce((acc, item) => {
    let cat = item.categoryName
    if (cat === "Snacks" || item.variantName.includes("Sejwan")) cat = "Snacks"
    if (!acc[cat]) acc[cat] = { revenue: 0, profit: 0, units: 0 }
    acc[cat].revenue += item.totalRevenue
    acc[cat].profit += item.totalProfit
    acc[cat].units += item.quantity
    return acc
  }, {} as Record<string, { revenue: number, profit: number, units: number }>)

  let reportBody = `# Final Truth Accounting Report\n\n**Generated On:** ${new Date().toISOString()}\n\n`
  reportBody += `## Total Financials\n*   **Total Revenue:** ₹${finalRevenue.toFixed(2)}\n*   **Total Profit:** ₹${finalProfit.toFixed(2)}\n*   **Total OrderItems:** ${finalItems.length}\n`
  
  reportBody += `\n## Breakdown by Category\n\n`
  reportBody += `| Category | Units | Revenue | Profit |\n`
  reportBody += `| :--- | :--- | :--- | :--- |\n`
  
  for (const cat of Object.keys(categoryStats).sort()) {
    reportBody += `| **${cat}** | ${categoryStats[cat].units.toLocaleString()} | ₹${categoryStats[cat].revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | ₹${categoryStats[cat].profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} |\n`
  }

  fs.writeFileSync('/Users/apple/.gemini/antigravity/brain/3c86c203-3b5a-4923-837e-db0974059fb9/final_truth_report.md', reportBody)
  console.log("Report generated!")
}

main().catch(console.error).finally(() => prisma.$disconnect())
