import { prisma } from './lib/prisma'

async function main() {
  const patraVariant = await prisma.productVariant.findFirst({
    where: { name: { contains: "Patra", mode: "insensitive" } }
  })
  
  if (patraVariant) {
    const existingPricing = await prisma.productPricing.findFirst({
      where: { variantId: patraVariant.id }
    })
    
    if (!existingPricing) {
      await prisma.productPricing.create({
        data: {
          variantId: patraVariant.id,
          costPrice: 75,
          minSellingPrice: 75,
          maxSellingPrice: 90,
          pricingType: "FIXED"
        }
      })
      console.log("Patra pricing inserted!")
    } else {
      console.log("Patra pricing already exists.")
    }
  } else {
    console.log("Patra variant not found!")
  }
}
main().catch(console.error).finally(() => prisma.$disconnect())
