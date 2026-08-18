import { getIncomingShipments, getSuppliers, getPurchaseOrders } from "@/app/actions/inventory"
import { IncomingDashboard } from "@/components/inventory/incoming/incoming-dashboard"

export const dynamic = "force-dynamic"

export default async function IncomingShipmentsPage() {
  const [shipments, suppliers, pos] = await Promise.all([
    getIncomingShipments(),
    getSuppliers(),
    getPurchaseOrders(),
  ])

  return (
    <IncomingDashboard
      initialData={shipments}
      suppliers={suppliers}
      pos={pos}
    />
  )
}
