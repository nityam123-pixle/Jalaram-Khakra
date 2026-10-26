import { getCRMCustomers, getCustomerStats } from "@/app/actions/customers"
import { CustomersDashboard } from "@/components/customers/customers-dashboard"

export const dynamic = "force-dynamic"

export default async function CustomersPage() {
  const [customers, stats] = await Promise.all([
    getCRMCustomers(),
    getCustomerStats(),
  ])

  return (
    <div className="flex-1 w-full">
      <CustomersDashboard
        initialCustomers={customers}
        initialStats={stats}
      />
    </div>
  )
}
