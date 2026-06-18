import { getAllOrders, getOrderStats, getUniqueCities } from "@/app/actions/order"
import { getFullCatalog } from "@/app/actions/catalog"
import { OrdersDashboard } from "@/components/orders/orders-dashboard"
import { serializePrisma } from "@/lib/prisma-serializer"

export const dynamic = "force-dynamic"

export default async function OrdersPage() {
  const initialOrdersData = await getAllOrders({ page: 1, limit: 10 })
  const stats = await getOrderStats()
  const cities = await getUniqueCities()
  
  const rawCatalog = await getFullCatalog()
  const catalog = serializePrisma(rawCatalog)
  
  return (
    <div className="flex-1 w-full">
      <OrdersDashboard 
        initialOrdersData={initialOrdersData} 
        initialStats={stats}
        initialCities={cities}
        catalog={catalog} 
      />
    </div>
  )
}

