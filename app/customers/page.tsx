import { getCRMCustomers } from "../actions/customers"
import { CustomerClient } from "./customer-client"

export const dynamic = "force-dynamic"

export default async function CustomersPage() {
  const initialData = await getCRMCustomers();
  
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <CustomerClient initialData={initialData} />
    </div>
  )
}
