import { PrismaClient } from "@prisma/client"
import { KHAKHRA_TYPES } from "../lib/supabase"

const prisma = new PrismaClient()

// Helper to generate simple slugs
const toSlug = (str: string) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-')

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
    const slug = toSlug(cat.name)
    let dbCat = await prisma.productCategory.findFirst({ where: { slug } })
    
    if (!dbCat) {
      dbCat = await prisma.productCategory.create({
        data: {
          name: cat.name,
          slug,
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

    const slug = toSlug(item.name)
    let product = await prisma.product.findFirst({ where: { slug } })

    if (!product) {
      product = await prisma.product.create({
        data: {
          categoryId,
          name: item.name,
          slug,
          isActive: true
        }
      })
    }

    // Function to create pricing AND historical pricing records
    const createPricing = async (
      variantId: string, 
      category: string, 
      costPrice: number, 
      minSelling: number, 
      maxSelling: number, 
      pricingType: "FIXED" | "RANGE" | "MRP"
    ) => {
      // Create current active pricing
      await prisma.productPricing.create({
        data: {
          variantId,
          pricingType,
          costPrice,
          minSellingPrice: minSelling,
          maxSellingPrice: maxSelling,
        }
      })

      // Historical Khakhra records
      if (category === "regular") {
        // Before 27/03/2026
        await prisma.pricingHistory.create({
          data: {
            variantId,
            pricingType,
            costPrice: costPrice - 20, // Adjusting historical cost down proportionally
            minSellingPrice: 200,
            maxSellingPrice: 225,
            effectiveFrom: new Date('2020-01-01T00:00:00Z'),
            effectiveTo: new Date('2026-03-27T00:00:00Z'),
          }
        })

        // On or After 27/03/2026
        await prisma.pricingHistory.create({
          data: {
            variantId,
            pricingType,
            costPrice: costPrice,
            minSellingPrice: 220,
            maxSellingPrice: 250,
            effectiveFrom: new Date('2026-03-27T00:00:00Z'),
          }
        })
      } else {
        // Generic historical record for others
        await prisma.pricingHistory.create({
          data: {
            variantId,
            pricingType,
            costPrice,
            minSellingPrice: minSelling,
            maxSellingPrice: maxSelling,
            effectiveFrom: new Date('2020-01-01T00:00:00Z'),
          }
        })
      }
    }

    const hasKg = item.sellBy === "kg" || item.sellBy === "both"
    const hasPacket = item.sellBy === "packet" || item.sellBy === "both"

    if (hasKg) {
      let variant = await prisma.productVariant.findFirst({
        where: { productId: product.id, unitType: "KG" }
      })

      if (!variant) {
        variant = await prisma.productVariant.create({
          data: {
            productId: product.id,
            name: "1kg",
            sku: `${slug}-1kg`,
            weightKg: 1.0,
            unitType: "KG",
            isActive: true
          }
        })
        
        const costPrice = item.basePrice - (item.baseProfit || 0)
        // If it's regular khakhra, the new pricing after 27/03/2026 is min 220, max 250
        const isRegular = item.category === "regular"
        const currentMin = isRegular ? 220 : item.basePrice
        const currentMax = isRegular ? 250 : item.maxPrice

        await createPricing(variant.id, item.category, costPrice, currentMin, currentMax, "RANGE")
      }
    }

    if (hasPacket) {
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
            sku: `${slug}-pkt-${weight*1000}g`,
            weightKg: weight,
            unitType: "PACKET",
            isActive: true
          }
        })

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

        await createPricing(variant.id, item.category, costPrice, minSelling, maxSelling, pType)
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
