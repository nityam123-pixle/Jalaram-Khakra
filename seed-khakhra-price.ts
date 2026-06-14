/**
 * Seeder: Update Khakhra pricing to 2024-25 rates
 * 
 * Business rules:
 *  - Khakhra cost price:       ₹195/kg
 *  - Regular Khakhra sell:     ₹195–₹220/kg  (min = cost so no selling below cost)
 *  - Premium Khakhra sell:     ₹210–₹240/kg
 *  - Bhakri / Farali / etc:   keep existing (unchanged)
 *  - Mathiya / Chorafali:      keep existing (unchanged)
 *
 * Profit at ₹220 with ₹195 cost = ₹25/kg ✓
 * (old cost was 178.6 → gave wrong ₹41.4/kg profit)
 */

import { prisma } from './lib/prisma'

async function main() {
  console.log("🌾 Seeding Khakhra pricing to ₹195 cost...")

  // Find the Khakhra category
  const khakhraCat = await prisma.productCategory.findFirst({
    where: { name: { contains: 'Khakhra', mode: 'insensitive' } }
  })
  if (!khakhraCat) {
    console.error("❌ Khakhra category not found!")
    process.exit(1)
  }
  console.log(`Found category: ${khakhraCat.name} (${khakhraCat.id})`)

  // Get all products in Khakhra category
  const products = await prisma.product.findMany({
    where: { categoryId: khakhraCat.id },
    include: {
      variants: {
        include: { pricingRules: true }
      }
    }
  })
  console.log(`Found ${products.length} products in Khakhra category`)

  let updatedCount = 0
  for (const prod of products) {
    for (const variant of prod.variants) {
      for (const rule of variant.pricingRules) {
        const isPremium = prod.name.toLowerCase().includes('premium') ||
                          variant.name.toLowerCase().includes('premium')
        
        const newCostPrice = 195
        const newMinSell   = isPremium ? 210 : 195
        const newMaxSell   = isPremium ? 240 : 220

        await prisma.productPricing.update({
          where: { id: rule.id },
          data: {
            costPrice:       newCostPrice,
            minSellingPrice: newMinSell,
            maxSellingPrice: newMaxSell,
          }
        })

        console.log(`  ✓ ${prod.name} / ${variant.name}: cost=₹${newCostPrice}, sell=₹${newMinSell}–₹${newMaxSell}`)
        updatedCount++
      }
    }
  }

  console.log(`\n✅ Updated ${updatedCount} pricing rules`)
  console.log(`   At ₹220 sell price, profit = ₹${220 - 195}/kg ✓`)
}

main().finally(() => process.exit())
