import { prisma } from "../lib/prisma"
import * as fs from "fs"

async function main() {
  const customers = await prisma.customer.findMany({
    orderBy: { created_at: 'asc' }
  })
  
  const shopNameMap = new Map<string, typeof customers>()
  for (const c of customers) {
    if (c.isArchived) continue
    const sName = c.shop_name.trim().toLowerCase().replace(/\s+/g, ' ')
    if (!shopNameMap.has(sName)) shopNameMap.set(sName, [])
    shopNameMap.get(sName)!.push(c)
  }

  const autoMergeNames = [
    "aone bakery",
    "avsar farsan",
    "cash sales",
    "saheb pendawala",
    "shyam dairy",
    "surbhi amrut dairy farm", // user specified Savarkundla, we need to filter by city
    "thakkar pro stores"
  ]

  let report = `# Customer Merge Execution Report\n\nGenerated On: ${new Date().toISOString()}\n\n`
  let mergeCount = 0

  for (const [sName, group] of shopNameMap.entries()) {
    if (!autoMergeNames.includes(sName)) continue
    
    // Group by city
    const cityGroups = new Map<string, typeof group>()
    for (const c of group) {
      const city = c.city.trim().toLowerCase()
      if (!cityGroups.has(city)) cityGroups.set(city, [])
      cityGroups.get(city)!.push(c)
    }

    for (const [city, cityGroup] of cityGroups.entries()) {
      if (cityGroup.length > 1) {
        // Only merge if the city is Savarkundla for Surbhi, or others
        if (sName === "surbhi amrut dairy farm" && city !== "savarkundla") {
          continue // Skip branches for Surbhi
        }

        const master = cityGroup[0]
        const duplicates = cityGroup.slice(1)

        report += `### Merged: ${master.shop_name} (${master.city})\n`
        report += `- **Master ID**: ${master.id}\n`

        for (const dup of duplicates) {
          // Update orders
          const updateOrders = await prisma.order.updateMany({
            where: { customerId: dup.id },
            data: { customerId: master.id }
          })
          
          // Archive dup
          await prisma.customer.update({
            where: { id: dup.id },
            data: {
              isArchived: true,
              mergedIntoCustomerId: master.id
            }
          })
          
          report += `- Archived ID: ${dup.id} (Reassigned ${updateOrders.count} orders)\n`
          mergeCount++
        }
        report += `\n`
      }
    }
  }

  report += `\nTotal duplicates merged and archived: ${mergeCount}\n`
  fs.writeFileSync('reports/customer_merge_execution_report.md', report)
  console.log("Generated reports/customer_merge_execution_report.md")
}

main().catch(console.error).finally(() => prisma.$disconnect())
