import { getCurrentInventory } from "@/app/actions/inventory"
import { CurrentStockClient } from "./client"

export default async function CurrentStockPage() {
  const inventory = await getCurrentInventory()
  return <CurrentStockClient initialData={inventory} />
}
