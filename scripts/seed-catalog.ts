import { prisma } from "../lib/prisma"
import { KHAKHRA_TYPES } from "../lib/supabase"

async function main() {
  console.log("Seeding Catalog data...")

  // Define unique categories from the hardcoded list
  const categoryNames = [
    { name: "Khakhra", idName: "regular", displayOrder: 1 },
    { name: "Premium Khakhra", idName: "premium", displayOrder: 2 },
    { name: "Bhakhri", idName: "bhakri", displayOrder: 3 },
    { name: "Bhakarwadi", idName: "bhakarwadi", displayOrder: 4 },
    { name: "Fulvadi", idName: "fulvadi", displayOrder: 5 },
    { name: "Farali", idName: "farali", displayOrder: 6 },
    { name: "Chikki", idName: "chikki", displayOrder: 7 },
    { name: "Snacks", idName: "sejwan", displayOrder: 8 },
    { name: "Mathiya Puri", idName: "mathiyaPuri", displayOrder: 9 },
  ]

  const createdCategories: Record<string, string> = {}

  for (const cat of categoryNames) {
    const existing = await prisma.productCategory.findFirst({
      where: { name: cat.name }
    })
    
    let dbCat
    if (existing) {
      dbCat = existing
    } else {
      dbCat = await prisma.productCategory.create({
        data: {
          name: cat.name,
          slug: cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          displayOrder: cat.displayOrder,
          isActive: true
        }
      })
    }
    createdCategories[cat.idName] = dbCat.id
  }

  // Iterate over KHAKHRA_TYPES to create Products and Variants
  for (const item of KHAKHRA_TYPES) {
    const categoryId = createdCategories[item.category]
    if (!categoryId) {
      console.warn(`Category not found for ${item.category}`)
      continue
    }

    // Check if Product exists
    let product = await prisma.product.findFirst({
      where: { name: item.name, categoryId }
    })

    if (!product) {
      product = await prisma.product.create({
        data: {
          categoryId,
          name: item.name,
          slug: item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          isActive: true
        }
      })
    }

    // Determine Variants
    // If it sells by 'kg', it has a 1kg variant
    // If it sells by 'packet', it has a packet variant (e.g., 200g or whatever packetWeight says)
    // If it sells by 'both', it has both

    const createPricing = async (variantId: string, costPrice: number, minSelling: number, maxSelling: number, pricingType: "FIXED" | "RANGE" | "MRP") => {
      await prisma.productPricing.create({
        data: {
          variantId,
          pricingType,
          costPrice,
          minSellingPrice: minSelling,
          maxSellingPrice: maxSelling,
        }
      })

      await prisma.pricingHistory.create({
        data: {
          variantId,
          pricingType,
          costPrice,
          minSellingPrice: minSelling,
          maxSellingPrice: maxSelling,
          effectiveFrom: new Date('2020-01-01T00:00:00Z'), // Far past
        }
      })
    }

    const hasKg = item.sellBy === "kg" || item.sellBy === "both"
    const hasPacket = item.sellBy === "packet" || item.sellBy === "both"

    if (hasKg) {
      // Create KG variant
      let variant = await prisma.productVariant.findFirst({
        where: { productId: product.id, unitType: "KG" }
      })

      if (!variant) {
        variant = await prisma.productVariant.create({
          data: {
            productId: product.id,
            name: "1kg",
            weightKg: 1.0,
            unitType: "KG",
            isActive: true
          }
        })
        
        const costPrice = item.basePrice - (item.baseProfit || 0)
        await createPricing(variant.id, costPrice, item.basePrice, item.maxPrice, "RANGE")
      }
    }

    if (hasPacket) {
      // Create Packet variant
      let variant = await prisma.productVariant.findFirst({
        where: { productId: product.id, unitType: "PACKET" }
      })

      if (!variant) {
        const weight = (item as any).packetWeight || 0.2
        const variantName = weight === 1 ? "1kg Packet" : (weight === 0.5 ? "500g Packet" : "200g Packet")

        variant = await prisma.productVariant.create({
          data: {
            productId: product.id,
            name: variantName,
            weightKg: weight,
            unitType: "PACKET",
            isActive: true
          }
        })

        // Cost price logic for packets
        let costPrice = 0
        let minSelling = item.basePacketPrice || 0
        let maxSelling = item.maxPacketPrice || minSelling
        let pType: "FIXED" | "RANGE" | "MRP" = minSelling === maxSelling ? "FIXED" : "RANGE"

        if (item.category === "bhakarwadi" || item.category === "fulvadi" || item.category === "chikki") {
           pType = "MRP"
           if (item.category === "bhakarwadi") costPrice = 27
           if (item.category === "fulvadi") costPrice = 80
           if (item.category === "chikki") {
              costPrice = 27; minSelling = 31; maxSelling = 40; pType = "RANGE"
           }
        } else {
           costPrice = (item.basePacketPrice || 0) - (item.basePacketProfit || 0)
        }

        if (item.category === "sejwan" || item.category === "mathiyaPuri") {
           costPrice = (item as any).basePacketCost || 0
        }

        await createPricing(variant.id, costPrice, minSelling, maxSelling, pType)
      }
    }
  }

  console.log("Seeding Catalog completed!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
