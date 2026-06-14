import { prisma } from "../lib/prisma"
const { KHAKHRA_TYPES } = require("../lib/supabase")

async function main() {
  const legacyItems = await prisma.khakhraItem.findMany()

  const prices: Record<number, number> = {}
  
  for (const item of legacyItems) {
    const typeDef = KHAKHRA_TYPES.find((k: any) => k.name === item.khakhra_type)
    if (typeDef && typeDef.category === 'sejwan') {
      const isPacket = item.is_packet_item || false
      const quantity = Number(isPacket ? (item.packet_quantity || 0) : item.quantity_kg)
      const price = Number(isPacket ? (item.price_per_packet || 0) : item.price_per_kg)
      
      prices[price] = (prices[price] || 0) + quantity
    }
  }

  console.log("SEJWAN/SNACKS PRICE HISTORY:")
  console.table(prices)
}

main().catch(console.error).finally(() => prisma.$disconnect())
