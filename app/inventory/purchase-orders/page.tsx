import { getPurchaseOrders, getSuppliers } from "@/app/actions/inventory"
import { getFullCatalog } from "@/app/actions/catalog"
import { PurchaseOrdersClient } from "./client"

export default async function PurchaseOrdersPage() {
  const [pos, suppliers, catalog] = await Promise.all([
    getPurchaseOrders(),
    getSuppliers(),
    getFullCatalog()
  ])

  return (
    <PurchaseOrdersClient 
      initialData={pos} 
      suppliers={suppliers} 
      catalog={catalog} 
    />
  )
}
