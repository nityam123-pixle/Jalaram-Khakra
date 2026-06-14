import { prisma } from "../lib/prisma"
import * as fs from "fs"

async function main() {
  const customers = await prisma.customer.findMany({
    orderBy: { created_at: 'asc' }
  })
  
  // Also get orders to check for orphans
  const orders = await prisma.order.findMany()
  
  const shopNameMap = new Map<string, typeof customers>()
  const phoneMap = new Map<string, typeof customers>()
  
  for (const c of customers) {
    const sName = c.shop_name.trim().toLowerCase()
    if (!shopNameMap.has(sName)) shopNameMap.set(sName, [])
    shopNameMap.get(sName)!.push(c)
    
    if (c.phone) {
      const p = c.phone.trim().replace(/\D/g, '')
      if (p.length > 5) { // ignoring empty or tiny phones
        if (!phoneMap.has(p)) phoneMap.set(p, [])
        phoneMap.get(p)!.push(c)
      }
    }
  }

  let report = `# Customer Audit Report\n\nGenerated On: ${new Date().toISOString()}\n\n`
  report += `## Summary\n`
  report += `- Total Customers: ${customers.length}\n`
  report += `- Total Orders: ${orders.length}\n\n`

  report += `## Duplicate Shop Names\n`
  for (const [sName, group] of shopNameMap.entries()) {
    if (group.length > 1) {
      report += `### ${group[0].shop_name} (${group.length} duplicates)\n`
      for (const c of group) {
        report += `- ID: ${c.id} | City: ${c.city} | Phone: ${c.phone || 'N/A'} | Address: ${c.address || 'N/A'}\n`
      }
    }
  }

  report += `\n## Duplicate Phone Numbers\n`
  for (const [phone, group] of phoneMap.entries()) {
    if (group.length > 1) {
      report += `### ${phone} (${group.length} duplicates)\n`
      for (const c of group) {
        report += `- ID: ${c.id} | Shop: ${c.shop_name} | City: ${c.city}\n`
      }
    }
  }

  report += `\n## Orphan Orders (Shop/City not in Customer table)\n`
  const orphanMap = new Map<string, number>()
  for (const o of orders) {
    const sName = o.shop_name.trim().toLowerCase()
    const cCity = o.city.trim().toLowerCase()
    
    // Check if this exact combo exists in customers
    const exists = customers.some(c => c.shop_name.trim().toLowerCase() === sName && c.city.trim().toLowerCase() === cCity)
    if (!exists) {
      const key = `${o.shop_name} - ${o.city}`
      orphanMap.set(key, (orphanMap.get(key) || 0) + 1)
    }
  }

  for (const [key, count] of orphanMap.entries()) {
    report += `- ${key} (${count} orders)\n`
  }

  fs.writeFileSync('reports/customer_audit_report.md', report)
  console.log("Audit report generated at reports/customer_audit_report.md")
}

main().catch(console.error).finally(() => prisma.$disconnect())
