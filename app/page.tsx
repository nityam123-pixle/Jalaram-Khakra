import { getDashboardData } from "./actions/analytics"
import { DashboardCoordinator } from "@/components/dashboard/dashboard-coordinator"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const { orders, catalog, customers } = await getDashboardData()

  return (
    <div className="flex-1 w-full">
      <DashboardCoordinator
        initialOrders={orders}
        catalog={catalog}
        customers={customers}
      />
    </div>
  )
}
