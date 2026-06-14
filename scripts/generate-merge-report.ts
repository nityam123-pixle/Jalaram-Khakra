import { prisma } from "../lib/prisma"
import * as fs from "fs"

async function main() {
  const customers = await prisma.customer.findMany({
    orderBy: { created_at: 'asc' } // The earliest created record will be the default master
  })
  
  const shopNameMap = new Map<string, typeof customers>()
  
  for (const c of customers) {
    // Normalizing name to detect duplicates, including simple space removal
    const sName = c.shop_name.trim().toLowerCase().replace(/\s+/g, ' ')
    if (!shopNameMap.has(sName)) shopNameMap.set(sName, [])
    shopNameMap.get(sName)!.push(c)
  }

  let report = `# Customer Merge Proposals\n\nGenerated On: ${new Date().toISOString()}\n\n`
  report += `This report outlines proposed merges for duplicate customer records. The oldest created record is selected as the default Master.\n\n`

  report += `## Proposed Merges by Shop Name\n\n`
  
  for (const [sName, group] of shopNameMap.entries()) {
    if (group.length > 1) {
      // Group them by City to distinguish real branches vs typos
      const cityGroups = new Map<string, typeof group>()
      for (const c of group) {
        const city = c.city.trim().toLowerCase()
        if (!cityGroups.has(city)) cityGroups.set(city, [])
        cityGroups.get(city)!.push(c)
      }

      for (const [city, cityGroup] of cityGroups.entries()) {
        if (cityGroup.length > 1) {
          const master = cityGroup[0]
          const duplicates = cityGroup.slice(1)
          
          report += `### 🔄 MERGE: ${master.shop_name} (${master.city})\n`
          report += `**Master Record:**\n`
          report += `- ID: \`${master.id}\`\n`
          report += `- Address: ${master.address || 'N/A'} | Phone: ${master.phone || 'N/A'}\n\n`
          
          report += `**Records to Merge & Archive (Will be repointed to Master):**\n`
          for (const d of duplicates) {
            report += `- ID: \`${d.id}\` | Address: ${d.address || 'N/A'} | Phone: ${d.phone || 'N/A'}\n`
          }
          report += `\n---\n\n`
        }
      }

      // If there are different cities, note them as potential cross-city duplicates (branches)
      if (cityGroups.size > 1) {
        report += `### ⚠️ POTENTIAL BRANCHES: ${group[0].shop_name}\n`
        report += `Found under the same name but in different cities. These are likely branches and should **not** be merged automatically.\n`
        for (const [city, cityGroup] of cityGroups.entries()) {
          report += `- City: **${cityGroup[0].city}** (${cityGroup.length} record(s))\n`
        }
        report += `\n---\n\n`
      }
    }
  }

  fs.writeFileSync('reports/customer_merge_report.md', report)
  console.log("Merge proposal report generated at reports/customer_merge_report.md")
}

main().catch(console.error).finally(() => prisma.$disconnect())
