import { getPurchaseOrders, getSuppliers } from "@/app/actions/inventory"
import { getFullCatalog } from "@/app/actions/catalog"
import { PurchaseOrdersDashboard } from "@/components/inventory/purchase-orders/purchase-orders-dashboard"

export const dynamic = "force-dynamic"

export default async function PurchaseOrdersPage() {
  const [pos, suppliers, catalog] = await Promise.all([
    getPurchaseOrders(),
    getSuppliers(),
    getFullCatalog(),
  ])

  return (
    <PurchaseOrdersDashboard
      initialData={pos}
      suppliers={suppliers}
      catalog={catalog}
    />
  )
}
