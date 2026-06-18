import { getAllOrders } from "@/app/actions/order"
import { getFullCatalog } from "@/app/actions/catalog"
import { OrdersDashboard } from "@/components/orders/orders-dashboard"
import { serializePrisma } from "@/lib/prisma-serializer"

export const dynamic = "force-dynamic"

export default async function OrdersPage() {
  const orders = await getAllOrders()
  const rawCatalog = await getFullCatalog()
  const catalog = serializePrisma(rawCatalog)
  
  return (
    <div className="flex-1 w-full">
      <OrdersDashboard initialOrders={orders} catalog={catalog} />
    </div>
  )
}

