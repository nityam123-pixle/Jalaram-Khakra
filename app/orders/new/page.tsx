import { getFullCatalog } from "@/app/actions/catalog"
import { OrderWizard } from "@/components/order-wizard/wizard"
import { serializePrisma } from "@/lib/prisma-serializer"

export const dynamic = "force-dynamic"

export default async function NewOrderPage() {
  const catalogDataRaw = await getFullCatalog()
  const catalogData = serializePrisma(catalogDataRaw)
  
  return (
    <div className="flex-1 w-full">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Create Order</h1>
          <p className="text-muted-foreground">Follow the steps to complete a new order</p>
        </div>
        
        <div className="bg-card rounded-xl shadow-sm border border-border p-4 sm:p-6 min-h-[600px]">
          <OrderWizard catalogData={catalogData} />
        </div>
      </div>
    </div>
  )
}
