import { getStockLedger } from "@/app/actions/inventory"
import { MovementsTimelineClient } from "./client"

export default async function MovementsTimelinePage() {
  const { entries: ledger } = await getStockLedger({ pageSize: 150 })
  return <MovementsTimelineClient initialData={ledger} />
}
