import { prisma } from "../lib/prisma"
import * as fs from "fs"

async function main() {
  const customerCount = await prisma.customer.count()
  const orderCount = await prisma.order.count()
  const orderItemCount = await prisma.orderItem.count()
  
  const aggregates = await prisma.orderItem.aggregate({
    _sum: {
      totalRevenue: true,
      totalProfit: true
    }
  })
  
  const revenue = aggregates._sum.totalRevenue || 0
  const profit = aggregates._sum.totalProfit || 0
  
  const report = `# Pre UI Refactor Snapshot

Generated On: ${new Date().toISOString()}

- Customer Count: ${customerCount}
- Order Count: ${orderCount}
- OrderItem Count: ${orderItemCount}
- Revenue: ₹${revenue.toFixed(2)}
- Profit: ₹${profit.toFixed(2)}
`

  fs.writeFileSync('reports/pre_ui_refactor_snapshot.md', report)
  console.log("Generated reports/pre_ui_refactor_snapshot.md")
}

main().catch(console.error).finally(() => prisma.$disconnect())
