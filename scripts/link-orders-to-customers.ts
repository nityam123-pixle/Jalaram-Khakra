import { prisma } from "../lib/prisma"
import * as fs from "fs"

async function main() {
  const orders = await prisma.order.findMany()
  const customers = await prisma.customer.findMany({
    orderBy: { created_at: 'asc' }
  })
  
  let linkedCount = 0
  let matchedByShopAndCity = 0
  let matchedByShopOnly = 0
  let unlinked = 0
  let unlinkedDetails: string[] = []
  
  // Group customers by shopName+city, and just shopName
  const exactMap = new Map<string, string>() // key: "shop|city", value: customerId
  const shopMap = new Map<string, string>() // key: "shop", value: customerId
  
  for (const c of customers) {
    const shop = c.shop_name.trim().toLowerCase().replace(/\s+/g, ' ')
    const city = c.city.trim().toLowerCase()
    
    const exactKey = `${shop}|${city}`
    if (!exactMap.has(exactKey)) exactMap.set(exactKey, c.id) // First one (oldest) becomes target
    if (!shopMap.has(shop)) shopMap.set(shop, c.id)
  }

  for (const order of orders) {
    const oShop = order.shop_name.trim().toLowerCase().replace(/\s+/g, ' ')
    const oCity = order.city.trim().toLowerCase()
    const exactKey = `${oShop}|${oCity}`
    
    let targetId = exactMap.get(exactKey)
    if (targetId) {
      matchedByShopAndCity++
    } else {
      targetId = shopMap.get(oShop)
      if (targetId) matchedByShopOnly++
    }
    
    if (targetId) {
      await prisma.order.update({
        where: { id: order.id },
        data: { customerId: targetId }
      })
      linkedCount++
    } else {
      unlinked++
      unlinkedDetails.push(`Order ID: ${order.id} | Shop: ${order.shop_name} | City: ${order.city}`)
    }
  }

  const report = `# Order-Customer Link Report

Generated On: ${new Date().toISOString()}

- Total Orders Processed: ${orders.length}
- Successfully Linked: ${linkedCount}
  - Matched by Shop + City: ${matchedByShopAndCity}
  - Matched by Shop Only: ${matchedByShopOnly}
- Unlinked (Orphans): ${unlinked}

${unlinked > 0 ? "## Unlinked Orders Manual Review\n\n" + unlinkedDetails.join('\n') : "All orders successfully linked!"}
`
  
  fs.writeFileSync('reports/order_customer_link_report.md', report)
  console.log("Generated reports/order_customer_link_report.md")
}

main().catch(console.error).finally(() => prisma.$disconnect())
