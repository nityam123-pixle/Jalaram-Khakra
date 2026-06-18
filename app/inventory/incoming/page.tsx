import { getIncomingShipments, getSuppliers, getPurchaseOrders } from "@/app/actions/inventory"
import { IncomingShipmentsClient } from "./client"

export default async function IncomingShipmentsPage() {
  const [shipments, suppliers, pos] = await Promise.all([
    getIncomingShipments(),
    getSuppliers(),
    getPurchaseOrders()
  ])

  return (
    <IncomingShipmentsClient 
      initialData={shipments} 
      suppliers={suppliers} 
      pos={pos} 
    />
  )
}
