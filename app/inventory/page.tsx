import { getInventoryDashboard } from "@/app/actions/inventory"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Warehouse,
  Package,
  AlertTriangle,
  Truck,
  TrendingDown,
  Users,
  ClipboardList,
  ArrowDown,
  ArrowUp,
  Box,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { InventoryCategoryChart } from "@/components/inventory/inventory-category-chart"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

const ACTION_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  RECEIVED_FROM_SUPPLIER: {
    label: "Stock In",
    color: "text-emerald-600 dark:text-emerald-400",
    icon: <ArrowUp className="h-3.5 w-3.5" />,
  },
  SOLD_THROUGH_ORDER: {
    label: "Sold",
    color: "text-blue-600 dark:text-blue-400",
    icon: <ArrowDown className="h-3.5 w-3.5" />,
  },
  DAMAGED: {
    label: "Damaged",
    color: "text-red-600 dark:text-red-400",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
  MANUAL_ADJUSTMENT: {
    label: "Adjustment",
    color: "text-amber-600 dark:text-amber-400",
    icon: <Box className="h-3.5 w-3.5" />,
  },
  RETURN_RECEIVED: {
    label: "Return In",
    color: "text-purple-600 dark:text-purple-400",
    icon: <ArrowUp className="h-3.5 w-3.5" />,
  },
  RETURN_SENT: {
    label: "Return Out",
    color: "text-orange-600 dark:text-orange-400",
    icon: <ArrowDown className="h-3.5 w-3.5" />,
  },
  OPENING_STOCK: {
    label: "Opening",
    color: "text-slate-600 dark:text-slate-400",
    icon: <Package className="h-3.5 w-3.5" />,
  },
}

const PO_STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  ORDERED: { label: "Ordered", variant: "default" },
  IN_TRANSIT: { label: "In Transit", variant: "outline" },
  PARTIALLY_RECEIVED: { label: "Partial", variant: "outline" },
  RECEIVED: { label: "Received", variant: "default" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
}

export default async function InventoryPage() {
  const data = await getInventoryDashboard()
  const { kpis, recentLedger, categoryBreakdown, pendingShipments, pendingPOs } = data

  const kpiCards = [
    {
      title: "Inventory Value",
      value: formatCurrency(kpis.totalInventoryValue),
      icon: Warehouse,
      description: "Total stock at cost price",
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-50 dark:bg-violet-950/30",
      border: "border-violet-200 dark:border-violet-800",
    },
    {
      title: "Units In Stock",
      value: kpis.totalUnitsInStock.toLocaleString("en-IN"),
      icon: Package,
      description: "Across all tracked products",
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/30",
      border: "border-blue-200 dark:border-blue-800",
    },
    {
      title: "Low Stock",
      value: kpis.lowStockCount.toString(),
      icon: AlertTriangle,
      description: "Products below reorder point",
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/30",
      border: "border-amber-200 dark:border-amber-800",
      href: "/inventory/low-stock",
    },
    {
      title: "Out of Stock",
      value: kpis.outOfStockCount.toString(),
      icon: TrendingDown,
      description: "Products at zero units",
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-950/30",
      border: "border-red-200 dark:border-red-800",
    },
    {
      title: "Pending Deliveries",
      value: kpis.pendingDeliveries.toString(),
      icon: Truck,
      description: "Active incoming shipments",
      color: "text-cyan-600 dark:text-cyan-400",
      bg: "bg-cyan-50 dark:bg-cyan-950/30",
      border: "border-cyan-200 dark:border-cyan-800",
      href: "/inventory/incoming",
    },
    {
      title: "Incoming Value",
      value: formatCurrency(kpis.incomingValue),
      icon: ClipboardList,
      description: "Value of pending POs",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      border: "border-emerald-200 dark:border-emerald-800",
    },
    {
      title: "Monthly Consumption",
      value: kpis.monthlyConsumption.toFixed(1),
      icon: TrendingDown,
      description: "Units sold last 30 days",
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-950/30",
      border: "border-orange-200 dark:border-orange-800",
    },
    {
      title: "Active Suppliers",
      value: kpis.activeSuppliers.toString(),
      icon: Users,
      description: "Registered factories",
      color: "text-pink-600 dark:text-pink-400",
      bg: "bg-pink-50 dark:bg-pink-950/30",
      border: "border-pink-200 dark:border-pink-800",
      href: "/inventory/suppliers",
    },
  ]

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground">
            Real-time stock levels and supply chain overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/inventory/purchase-orders">
              <ClipboardList className="h-4 w-4 mr-1.5" />
              New PO
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/inventory/current">
              <Package className="h-4 w-4 mr-1.5" />
              View Stock
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon
          const content = (
            <Card
              key={card.title}
              className={`border ${card.border} ${card.bg} transition-all hover:shadow-md ${card.href ? "cursor-pointer" : ""}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">{card.title}</p>
                    <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                    <p className="text-xs text-muted-foreground">{card.description}</p>
                  </div>
                  <div className={`rounded-lg p-2 ${card.bg}`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
          return card.href ? (
            <Link key={card.title} href={card.href} className="block">
              {content}
            </Link>
          ) : (
            <div key={card.title}>{content}</div>
          )
        })}
      </div>

      {/* Middle row: Category Chart + Pending POs */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Category inventory chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Category Breakdown</CardTitle>
            <CardDescription>Stock value by product category</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryBreakdown.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Warehouse className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">No tracked inventory yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Enable inventory tracking in Settings to get started
                </p>
              </div>
            ) : (
              <InventoryCategoryChart data={categoryBreakdown} />
            )}
          </CardContent>
        </Card>

        {/* Pending Purchase Orders */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Open Purchase Orders</CardTitle>
                <CardDescription>Draft, ordered & in-transit POs</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/inventory/purchase-orders">View all</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingPOs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <ClipboardList className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">No open purchase orders</p>
                <Button variant="outline" size="sm" className="mt-3" asChild>
                  <Link href="/inventory/purchase-orders">Create PO</Link>
                </Button>
              </div>
            ) : (
              pendingPOs.slice(0, 5).map((po) => {
                const cfg = PO_STATUS_CONFIG[po.status] ?? { label: po.status, variant: "secondary" as const }
                return (
                  <div
                    key={po.id}
                    className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{po.poNumber}</p>
                      <p className="text-xs text-muted-foreground truncate">{po.supplier.name}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {po.invoiceAmount ? (
                        <span className="text-xs font-medium">
                          {formatCurrency(po.invoiceAmount)}
                        </span>
                      ) : null}
                      <Badge variant={cfg.variant} className="text-xs">
                        {cfg.label}
                      </Badge>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom row: Pending Shipments + Recent Ledger */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Pending Shipments */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Incoming Shipments</CardTitle>
                <CardDescription>Goods in transit or awaiting receipt</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/inventory/incoming">View all</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingShipments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Truck className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">No incoming shipments</p>
              </div>
            ) : (
              pendingShipments.slice(0, 5).map((shipment) => {
                const isOverdue =
                  shipment.expectedArrival &&
                  new Date(shipment.expectedArrival) < new Date()
                return (
                  <div
                    key={shipment.id}
                    className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{shipment.shipmentNumber}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {shipment.supplier?.name ?? "Unknown supplier"}
                        {shipment.transportName ? ` · ${shipment.transportName}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isOverdue ? (
                        <Badge variant="destructive" className="text-xs">Overdue</Badge>
                      ) : shipment.expectedArrival ? (
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(shipment.expectedArrival), { addSuffix: true })}
                        </span>
                      ) : null}
                      <Badge variant="outline" className="text-xs">{shipment.status}</Badge>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Recent Stock Movements */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Recent Movements</CardTitle>
                <CardDescription>Latest stock ledger entries</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/inventory/ledger">View ledger</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentLedger.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Package className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">No stock movements yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentLedger.map((entry) => {
                  const cfg = ACTION_CONFIG[entry.action]
                  const isIn = entry.quantity > 0
                  return (
                    <div key={entry.id} className="flex items-center gap-3 py-1.5">
                      <div className={`flex items-center justify-center rounded-full p-1.5 ${isIn ? "bg-emerald-100 dark:bg-emerald-950" : "bg-red-100 dark:bg-red-950"}`}>
                        <span className={cfg?.color ?? "text-slate-500"}>
                          {cfg?.icon}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {entry.variant.product.name} — {entry.variant.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {cfg?.label ?? entry.action} ·{" "}
                          {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <span
                        className={`text-sm font-semibold shrink-0 ${isIn ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
                      >
                        {isIn ? "+" : ""}{entry.quantity}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
