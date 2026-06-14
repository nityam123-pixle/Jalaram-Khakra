import { getAllOrders } from "@/app/actions/order"
import { OrdersList } from "@/components/orders-list"

export const dynamic = "force-dynamic"

export default async function OrdersPage() {
  const orders = await getAllOrders()
  
  return (
    <div className="flex-1 w-full">
      <OrdersList initialOrders={orders} />
    </div>
  )
}
