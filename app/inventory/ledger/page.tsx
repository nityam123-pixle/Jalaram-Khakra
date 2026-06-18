import { getStockLedger } from "@/app/actions/inventory"
import { StockLedgerClient } from "./client"

export default async function StockLedgerPage() {
  const { entries: ledger } = await getStockLedger({ pageSize: 100 })
  return <StockLedgerClient initialData={ledger} />
}
