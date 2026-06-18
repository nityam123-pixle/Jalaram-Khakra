import { getLowStockAlerts } from "@/app/actions/inventory"
import { LowStockClient } from "./client"

export default async function LowStockPage() {
  const alerts = await getLowStockAlerts()
  return <LowStockClient initialData={alerts} />
}
