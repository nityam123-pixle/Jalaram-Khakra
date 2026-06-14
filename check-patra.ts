import { prisma } from './lib/prisma'

async function main() {
  const patra = await prisma.productVariant.findFirst({
    where: { name: { contains: "Patra", mode: "insensitive" } },
    include: { pricingRules: true, product: true }
  })
  console.log("Patra Variant:", JSON.stringify(patra, null, 2))
}
main().catch(console.error).finally(() => prisma.$disconnect())
