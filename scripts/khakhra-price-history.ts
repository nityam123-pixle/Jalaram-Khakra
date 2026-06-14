import { prisma } from "../lib/prisma"
const { KHAKHRA_TYPES } = require("../lib/supabase")

async function main() {
  const orders = await prisma.order.findMany()
  const legacyItems = await prisma.khakhraItem.findMany()

  const legacyItemsByOrderId = legacyItems.reduce((acc, item) => {
    if (!acc[item.order_id]) acc[item.order_id] = []
    acc[item.order_id].push(item)
    return acc
  }, {} as any)

  const CUTOFF_DATE = new Date('2026-03-27T00:00:00.000Z')

  const preCutoffPricesKg: Record<string, number> = {}
  const postCutoffPricesKg: Record<string, number> = {}

  let preCutoffTotalKg = 0
  let postCutoffTotalKg = 0

  for (const order of orders) {
    const kItems = legacyItemsByOrderId[order.id] || []
    const isPostCutoff = new Date(order.created_at) >= CUTOFF_DATE

    for (const item of kItems) {
      const typeDef = KHAKHRA_TYPES.find((k: any) => k.name === item.khakhra_type)
      // Only count regular Khakhra (ignore premium, bhakhri, etc.)
      if (!typeDef || typeDef.category !== 'regular') continue

      // For this history tree, we'll only look at kg items (since the user specified 195 rs per kg)
      if (!item.is_packet_item) {
        const price = Number(item.price_per_kg)
        const qty = Number(item.quantity_kg)

        if (isPostCutoff) {
          postCutoffPricesKg[price] = (postCutoffPricesKg[price] || 0) + qty
          postCutoffTotalKg += qty
        } else {
          preCutoffPricesKg[price] = (preCutoffPricesKg[price] || 0) + qty
          preCutoffTotalKg += qty
        }
      }
    }
  }

  console.log("=========================================")
  console.log("REGULAR KHAKHRA (KG) PRICE HISTORY")
  console.log("=========================================\n")

  console.log("OLD PRICING (Before 27-03-2026)")
  console.log("Buying Price (Cost): ₹174.90 per kg")
  console.log("Selling Prices used in history (Total Kg sold):")
  console.table(preCutoffPricesKg)
  console.log(`Total Kg Sold: ${preCutoffTotalKg.toFixed(2)} kg\n`)

  console.log("NEW PRICING (After 27-03-2026)")
  console.log("Buying Price (Cost): ₹195.00 per kg")
  console.log("Selling Prices used in history (Total Kg sold):")
  console.table(postCutoffPricesKg)
  console.log(`Total Kg Sold: ${postCutoffTotalKg.toFixed(2)} kg\n`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
