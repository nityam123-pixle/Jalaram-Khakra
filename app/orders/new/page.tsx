import { getFullCatalog } from "@/app/actions/catalog"
import { OrderWizard } from "@/components/order-wizard/wizard"
import { serializePrisma } from "@/lib/prisma-serializer"
import { ArrowLeft, Sparkles, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"
export const maxDuration = 60

export default async function NewOrderPage() {
  const catalogDataRaw = await getFullCatalog()
  const catalogData = serializePrisma(catalogDataRaw)
  
  return (
    <div className="flex-1 w-full p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header with Back Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="h-9 w-9 rounded-lg border border-border">
            <Link href="/orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Create New Order</h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <ShoppingBag className="w-3 h-3" />
                Live Catalog
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select customer, add products with real-time pricing & profit calculations, and review.
            </p>
          </div>
        </div>
      </div>
      
      {/* Order Wizard Container */}
      <div className="bg-card rounded-2xl shadow-sm border border-border/80 p-5 sm:p-7 min-h-[600px]">
        <OrderWizard catalogData={catalogData} />
      </div>
    </div>
  )
}
