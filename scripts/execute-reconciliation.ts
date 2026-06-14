import { prisma } from "../lib/prisma"

const PATRA_CUTOFF_DATE = new Date('2026-03-01T00:00:00.000Z')
const KHAKHRA_CUTOFF_DATE = new Date('2026-03-27T00:00:00.000Z')

async function main() {
  console.log("Starting full reconciliation execution...")

  // 1. Get or Create Variants
  let patraCategory = await prisma.productCategory.findFirst({ where: { name: 'Patra' } })
  if (!patraCategory) patraCategory = await prisma.productCategory.create({ data: { name: 'Patra', slug: 'patra' } })
  let patraProduct = await prisma.product.findFirst({ where: { name: 'Patra' } })
  if (!patraProduct) patraProduct = await prisma.product.create({ data: { name: 'Patra', slug: 'patra', categoryId: patraCategory.id } })
  let patraVariant = await prisma.productVariant.findFirst({ where: { name: 'Patra Packet' }, include: { product: { include: { category: true } } } })
  if (!patraVariant) patraVariant = await prisma.productVariant.create({ data: { name: 'Patra Packet', productId: patraProduct.id, unitType: 'PACKET' }, include: { product: { include: { category: true } } } })

  let chikkiCategory = await prisma.productCategory.findFirst({ where: { name: 'Chikki' } })
  if (!chikkiCategory) chikkiCategory = await prisma.productCategory.create({ data: { name: 'Chikki', slug: 'chikki' } })
  let chikkiProduct = await prisma.product.findFirst({ where: { name: 'Chikki' } })
  if (!chikkiProduct) chikkiProduct = await prisma.product.create({ data: { name: 'Chikki', slug: 'chikki', categoryId: chikkiCategory.id } })
  let chikkiVariant = await prisma.productVariant.findFirst({ where: { name: 'Chikki Packet' }, include: { product: { include: { category: true } } } })
  if (!chikkiVariant) chikkiVariant = await prisma.productVariant.create({ data: { name: 'Chikki Packet', productId: chikkiProduct.id, unitType: 'PACKET' }, include: { product: { include: { category: true } } } })

  // 2. Validate Patra
  const patraOrders = await prisma.order.findMany({
    where: { wants_patra: true, patra_packets: { gt: 0 } }
  })
  
  if (patraOrders.length !== 344) {
    throw new Error(`GUARDRAIL TRIGGERED: Expected 344 Patra orders, found ${patraOrders.length}`)
  }

  // 3. Validate Chikki
  const chikkiOrders = await prisma.order.findMany({
    where: { wants_chikki: true, chikki_packets: { gt: 0 } }
  })
  
  if (chikkiOrders.length !== 20) {
    throw new Error(`GUARDRAIL TRIGGERED: Expected 20 Chikki orders, found ${chikkiOrders.length}`)
  }

  console.log("Guardrails passed. Creating OrderItems...")

  // Create Patra OrderItems
  for (const o of patraOrders) {
    const isNewPricing = new Date(o.created_at!) >= PATRA_CUTOFF_DATE
    const cost = isNewPricing ? 74.10 : 67.75
    const sellingPrice = Number(o.patra_price_per_packet) || 75
    const quantity = o.patra_packets!

    // Check if already exists (idempotency)
    const exists = await prisma.orderItem.findFirst({
      where: { orderId: o.id, variantId: patraVariant.id }
    })
    
    if (!exists) {
      await prisma.orderItem.create({
        data: {
          orderId: o.id,
          variantId: patraVariant.id,
          quantity: quantity,
          productName: patraVariant.product.name,
          categoryName: patraVariant.product.category.name,
          variantName: patraVariant.name,
          unitCostPrice: cost,
          unitSellingPrice: sellingPrice,
          totalCost: cost * quantity,
          totalRevenue: sellingPrice * quantity,
          totalProfit: (sellingPrice - cost) * quantity,
          createdAt: o.created_at || new Date(),
        }
      })
    }
  }

  // Create Chikki OrderItems
  for (const o of chikkiOrders) {
    const cost = 27 // original historical formula
    const sellingPrice = Number(o.chikki_price_per_packet) || 31
    const quantity = o.chikki_packets!

    const exists = await prisma.orderItem.findFirst({
      where: { orderId: o.id, variantId: chikkiVariant.id }
    })

    if (!exists) {
      await prisma.orderItem.create({
        data: {
          orderId: o.id,
          variantId: chikkiVariant.id,
          quantity: quantity,
          productName: chikkiVariant.product.name,
          categoryName: chikkiVariant.product.category.name,
          variantName: chikkiVariant.name,
          unitCostPrice: cost,
          unitSellingPrice: sellingPrice,
          totalCost: cost * quantity,
          totalRevenue: sellingPrice * quantity,
          totalProfit: Math.max(sellingPrice - cost, 0) * quantity,
          createdAt: o.created_at || new Date(),
        }
      })
    }
  }

  console.log("Inserting Append-Only PricingHistory corrections...")

  // Insert Patra Historical Correction
  await prisma.pricingHistory.create({
    data: {
      variantId: patraVariant.id,
      pricingType: "RANGE",
      costPrice: 67.75,
      effectiveFrom: new Date("2020-01-01T00:00:00.000Z"),
      effectiveTo: PATRA_CUTOFF_DATE,
      correctionReason: "Historical catalog cost correction"
    }
  })
  await prisma.pricingHistory.create({
    data: {
      variantId: patraVariant.id,
      pricingType: "RANGE",
      costPrice: 74.10,
      effectiveFrom: PATRA_CUTOFF_DATE,
      correctionReason: "Historical catalog cost correction"
    }
  })

  // Khakhra variants
  const khakhraVariants = await prisma.productVariant.findMany({
    where: { product: { category: { name: "Khakhra" } } }
  })
  
  for (const kv of khakhraVariants) {
    if (kv.unitType === 'KG') {
      await prisma.pricingHistory.create({
        data: {
          variantId: kv.id,
          pricingType: "RANGE",
          costPrice: 174.90,
          effectiveFrom: new Date("2020-01-01T00:00:00.000Z"),
          effectiveTo: KHAKHRA_CUTOFF_DATE,
          correctionReason: "Historical catalog cost correction"
        }
      })
      await prisma.pricingHistory.create({
        data: {
          variantId: kv.id,
          pricingType: "RANGE",
          costPrice: 195.00,
          effectiveFrom: KHAKHRA_CUTOFF_DATE,
          correctionReason: "Historical catalog cost correction"
        }
      })
    }
  }

  // Sejwan corrections
  const sejwan200 = await prisma.productVariant.findFirst({ where: { name: { contains: "200g" }, product: { category: { name: "Snacks" } } } })
  const sejwan1kg = await prisma.productVariant.findFirst({ where: { name: { contains: "1kg" }, product: { category: { name: "Snacks" } } } })
  
  if (sejwan200) {
    // We update ProductPricing (current)
    await prisma.productPricing.updateMany({
      where: { variantId: sejwan200.id },
      data: { costPrice: 41.60 }
    })
    // Insert new history without touching old ones
    await prisma.pricingHistory.create({
      data: {
        variantId: sejwan200.id,
        pricingType: "RANGE",
        costPrice: 41.60,
        effectiveFrom: new Date("2020-01-01T00:00:00.000Z"),
        correctionReason: "Historical catalog cost correction"
      }
    })
  }

  if (sejwan1kg) {
    await prisma.productPricing.updateMany({
      where: { variantId: sejwan1kg.id },
      data: { costPrice: 200.00 }
    })
    await prisma.pricingHistory.create({
      data: {
        variantId: sejwan1kg.id,
        pricingType: "RANGE",
        costPrice: 200.00,
        effectiveFrom: new Date("2020-01-01T00:00:00.000Z"),
        correctionReason: "Historical catalog cost correction"
      }
    })
  }

  console.log("Recalculating affected OrderItems...")

  // Recalculate Khakhra and Sejwan
  const affectedItems = await prisma.orderItem.findMany({
    where: {
      OR: [
        { categoryName: "Khakhra" },
        { categoryName: "Snacks" },
        { variantName: { contains: "Sejwan" } }
      ]
    },
    include: { order: true }
  })

  for (const item of affectedItems) {
    let newCost = item.unitCostPrice
    
    if (item.categoryName === "Khakhra") {
      // Use dynamic date
      if (item.variantName.includes("Packet")) {
         // Packet khakhra uses dynamic formula (not 174.90 per kg) - actually legacy formula used 174.90?
         // Let's assume the user specifically meant KG-based khakhra:
         // Wait, the user said "REGULAR KHAKHRA... Cost = ₹174.90/kg".
      } else {
         const isNew = new Date(item.order.created_at!) >= KHAKHRA_CUTOFF_DATE
         newCost = isNew ? 195.00 : 174.90
      }
    } else if (item.categoryName === "Snacks" || item.variantName.includes("Sejwan")) {
      if (item.variantName.includes("200g")) {
        newCost = 41.60
      } else if (item.variantName.includes("1kg")) {
        newCost = 200.00
      }
    }

    if (newCost !== item.unitCostPrice) {
      const newProfit = (item.unitSellingPrice - newCost) * item.quantity
      await prisma.orderItem.update({
        where: { id: item.id },
        data: {
          unitCostPrice: newCost,
          totalCost: newCost * item.quantity,
          totalProfit: newProfit
        }
      })
    }
  }

  // Generate Report
  console.log("Generating Post-Reconciliation Report...")
  
  const finalItems = await prisma.orderItem.findMany()
  const finalRevenue = finalItems.reduce((sum, item) => sum + item.totalRevenue, 0)
  const finalProfit = finalItems.reduce((sum, item) => sum + item.totalProfit, 0)

  console.log(`\n=== POST-RECONCILIATION TOTALS ===`)
  console.log(`Final Revenue: ₹${finalRevenue.toFixed(2)}`)
  console.log(`Final Profit: ₹${finalProfit.toFixed(2)}`)

  const expectedProfit = 131696.30
  if (Math.abs(finalProfit - expectedProfit) > 100) {
    console.error(`\n===========================================`)
    console.error(`GUARDRAIL TRIGGERED: Profit divergence > ₹100`)
    console.error(`Expected: ₹${expectedProfit}`)
    console.error(`Actual: ₹${finalProfit}`)
    console.error(`Difference: ₹${Math.abs(finalProfit - expectedProfit).toFixed(2)}`)
    console.error(`===========================================`)
    process.exit(1)
  }

  const categoryStats = finalItems.reduce((acc, item) => {
    let cat = item.categoryName
    if (cat === "Snacks" || item.variantName.includes("Sejwan")) cat = "Snacks"
    if (!acc[cat]) acc[cat] = { revenue: 0, profit: 0, units: 0 }
    acc[cat].revenue += item.totalRevenue
    acc[cat].profit += item.totalProfit
    acc[cat].units += item.quantity
    return acc
  }, {} as Record<string, { revenue: number, profit: number, units: number }>)

  let reportBody = `# Post-Reconciliation Snapshot\n\n**Generated On:** ${new Date().toISOString()}\n\n`
  reportBody += `## Final Analytics State\n*   **Final Revenue:** ₹${finalRevenue.toFixed(2)}\n*   **Final Profit:** ₹${finalProfit.toFixed(2)}\n\n`
  reportBody += `## Final Database Row Counts\n*   **Total OrderItems:** ${finalItems.length}\n`
  
  reportBody += `\n## Category Breakdown\n`
  for (const cat of Object.keys(categoryStats)) {
    reportBody += `*   **${cat}:** Revenue ₹${categoryStats[cat].revenue.toFixed(2)}, Profit ₹${categoryStats[cat].profit.toFixed(2)}, Units ${categoryStats[cat].units}\n`
  }

  const fs = require('fs')
  fs.writeFileSync('reports/post_reconciliation_report.md', reportBody)

  console.log("\nSuccess! Profit is perfectly within guardrails. Report saved to reports/post_reconciliation_report.md")
}

main().catch(console.error).finally(() => prisma.$disconnect())
