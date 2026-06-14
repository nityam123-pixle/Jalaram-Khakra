import { prisma } from "../lib/prisma"

async function main() {
  const variants = await prisma.productVariant.findMany({
    include: {
      product: {
        include: {
          category: true
        }
      },
      pricingRules: true,
      pricingHistory: true
    }
  })

  console.log("=== PRICING AUDIT ===")
  for (const variant of variants) {
    if (variant.product.name === "Patra" || variant.product.category.name === "Patra") {
      console.log(`\nFound Patra Variant: ${variant.name} (Unit: ${variant.unitType})`)
      console.log("  Pricing Rules:", JSON.stringify(variant.pricingRules, null, 2))
      console.log("  Pricing History:", JSON.stringify(variant.pricingHistory, null, 2))
    }
    if (variant.product.name.includes("Sada Khakhra") || variant.product.category.name === "Khakhra") {
       // Too many khakhras, just print Sada Khakhra
       if (variant.name.includes("Sada Khakhra")) {
         console.log(`\nFound Khakhra Variant: ${variant.name} (Unit: ${variant.unitType})`)
         console.log("  Pricing Rules:", JSON.stringify(variant.pricingRules, null, 2))
         console.log("  Pricing History:", JSON.stringify(variant.pricingHistory, null, 2))
       }
    }
    if (variant.product.category.name === "Snacks" || variant.name.includes("Sejwan")) {
      console.log(`\nFound Sejwan Variant: ${variant.name} (Unit: ${variant.unitType})`)
      console.log("  Pricing Rules:", JSON.stringify(variant.pricingRules, null, 2))
      console.log("  Pricing History:", JSON.stringify(variant.pricingHistory, null, 2))
    }
    if (variant.product.category.name === "Chikki") {
      console.log(`\nFound Chikki Variant: ${variant.name} (Unit: ${variant.unitType})`)
      console.log("  Pricing Rules:", JSON.stringify(variant.pricingRules, null, 2))
      console.log("  Pricing History:", JSON.stringify(variant.pricingHistory, null, 2))
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
