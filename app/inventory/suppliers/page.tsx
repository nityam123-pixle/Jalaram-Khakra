import { getSuppliers } from "@/app/actions/inventory"
import { CreateSupplierDialog } from "@/components/inventory/create-supplier-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Building2, Phone, MessageCircle, MapPin, Package, Calendar } from "lucide-react"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(date: Date | null) {
  if (!date) return "Never"
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date)
}

export default async function SuppliersPage() {
  const suppliers = await getSuppliers()

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-sm text-muted-foreground">
            Manage your vendors and factory contacts
          </p>
        </div>
        <CreateSupplierDialog />
      </div>

      {suppliers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Building2 className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold">No suppliers yet</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            Add your first supplier to start managing purchase orders and incoming stock.
          </p>
          <CreateSupplierDialog />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((supplier) => (
            <Card key={supplier.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      {supplier.name}
                    </CardTitle>
                    {supplier.city && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="mr-1 h-3.5 w-3.5 shrink-0" />
                        {supplier.city}
                      </div>
                    )}
                  </div>
                  {supplier.gstNumber && (
                    <Badge variant="outline" className="text-[10px] font-mono">
                      GST: {supplier.gstNumber}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-4">
                <div className="space-y-2 text-sm">
                  {supplier.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{supplier.phone}</span>
                    </div>
                  )}
                  {supplier.whatsapp && (
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{supplier.whatsapp}</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4 mt-auto">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5" />
                      Total Purchases
                    </p>
                    <p className="font-semibold">{formatCurrency(supplier.totalPurchases)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Last Order
                    </p>
                    <p className="font-semibold text-sm">{formatDate(supplier.lastOrderDate)}</p>
                  </div>
                </div>

                {supplier.outstandingOrders > 0 && (
                  <div className="mt-2 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2 text-xs font-medium flex items-center justify-between">
                    <span>Outstanding Orders</span>
                    <Badge variant="secondary" className="bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">
                      {supplier.outstandingOrders}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
