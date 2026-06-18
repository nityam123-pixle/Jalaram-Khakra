import { getIncomingShipments, getSuppliers, getPurchaseOrders } from "@/app/actions/inventory"
import { CreateShipmentDialog } from "@/components/inventory/create-shipment-dialog"
import { ReceiveStockDialog } from "@/components/inventory/receive-stock-dialog"
import { MarkArrivedButton } from "@/components/inventory/mark-arrived-button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Truck, Package, Calendar, AlertCircle, Clock, MapPin } from "lucide-react"

const STATUS_CONFIG: Record<string, { label: string; badge: "default" | "secondary" | "outline" | "destructive" }> = {
  PENDING: { label: "Pending", badge: "secondary" },
  IN_TRANSIT: { label: "In Transit", badge: "outline" },
  ARRIVED: { label: "Arrived", badge: "default" },
  RECEIVING: { label: "Receiving", badge: "default" },
  COMPLETED: { label: "Completed", badge: "secondary" },
  CANCELLED: { label: "Cancelled", badge: "destructive" },
}

function formatDate(date: Date | null) {
  if (!date) return "Not specified"
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date)
}

export default async function IncomingShipmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const [shipments, suppliers, pos] = await Promise.all([
    getIncomingShipments(),
    getSuppliers(),
    getPurchaseOrders()
  ])

  // Get POs that need shipments
  const activePOs = pos.filter(po => po.status === "ORDERED" || po.status === "PARTIALLY_RECEIVED")

  const params = await searchParams
  const filterStatus = params.status || "ALL"
  
  const filteredShipments = shipments.filter((s) => {
    if (filterStatus === "ALL") return true
    return s.status === filterStatus
  })

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Incoming Stock</h1>
          <p className="text-sm text-muted-foreground">
            Track and receive shipments from your suppliers
          </p>
        </div>
        <CreateShipmentDialog suppliers={suppliers} pos={activePOs} />
      </div>

      <Tabs defaultValue={filterStatus} className="w-full">
        <TabsList className="mb-4 flex-wrap h-auto">
          <TabsTrigger value="ALL" asChild><a href="?status=ALL">All Shipments</a></TabsTrigger>
          <TabsTrigger value="PENDING" asChild><a href="?status=PENDING">Pending</a></TabsTrigger>
          <TabsTrigger value="IN_TRANSIT" asChild><a href="?status=IN_TRANSIT">In Transit</a></TabsTrigger>
          <TabsTrigger value="ARRIVED" asChild><a href="?status=ARRIVED">Arrived & Ready</a></TabsTrigger>
          <TabsTrigger value="COMPLETED" asChild><a href="?status=COMPLETED">Completed</a></TabsTrigger>
        </TabsList>
        
        {filteredShipments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-card rounded-xl border border-border/80">
            <Truck className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold">No shipments found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              There are no shipments matching this status.
            </p>
            <CreateShipmentDialog suppliers={suppliers} pos={activePOs} />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredShipments.map((shipment) => {
              const cfg = STATUS_CONFIG[shipment.status] || STATUS_CONFIG.PENDING
              const isOverdue = shipment.expectedArrival && new Date(shipment.expectedArrival) < new Date() && shipment.status !== "COMPLETED"
              const itemCount = shipment.purchaseOrder?.items.length || 0

              return (
                <Card key={shipment.id} className="flex flex-col overflow-hidden">
                  <div className={`h-1.5 w-full ${isOverdue ? 'bg-red-500' : shipment.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                  <CardContent className="p-5 flex-1 flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm font-semibold">{shipment.shipmentNumber}</span>
                          <Badge variant={cfg.badge} className="text-[10px] h-5">{cfg.label}</Badge>
                        </div>
                        <p className="text-sm font-medium">{shipment.supplier?.name || "Unknown Supplier"}</p>
                      </div>
                      {isOverdue && (
                        <Badge variant="destructive" className="shrink-0 flex items-center gap-1 text-[10px]">
                          <AlertCircle className="h-3 w-3" /> Overdue
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm bg-muted/30 rounded-lg p-3">
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Truck className="h-3.5 w-3.5" /> Transport
                        </span>
                        <p className="font-medium truncate" title={shipment.transportName || ""}>
                          {shipment.transportName || "-"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" /> Vehicle
                        </span>
                        <p className="font-medium truncate">{shipment.vehicleNumber || "-"}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" /> Expected
                        </span>
                        <p className={`font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : ''}`}>
                          {formatDate(shipment.expectedArrival)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Package className="h-3.5 w-3.5" /> Contents
                        </span>
                        <p className="font-medium">
                          {shipment.purchaseOrder ? `${itemCount} products from PO` : "Unknown items"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto pt-2 flex items-center justify-end gap-2">
                      {shipment.status === "PENDING" || shipment.status === "IN_TRANSIT" ? (
                        <MarkArrivedButton shipmentId={shipment.id} />
                      ) : null}
                      
                      {(shipment.status === "ARRIVED" || shipment.status === "RECEIVING" || shipment.status === "IN_TRANSIT") && shipment.purchaseOrder ? (
                        <ReceiveStockDialog shipment={shipment} />
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </Tabs>
    </div>
  )
}
