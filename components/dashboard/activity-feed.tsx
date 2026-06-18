"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, CheckCircle, UserPlus, FileText, Clipboard, IndianRupee, Layers } from "lucide-react"

interface ActivityFeedProps {
  orders: any[]
  customers: any[]
  catalog?: any[]
}

export function ActivityFeed({ orders, customers, catalog = [] }: ActivityFeedProps) {
  const feedEvents = useMemo(() => {
    const events: { id: string; type: string; title: string; desc: string; date: Date; icon: any; colorClass: string }[] = []

    // 1. Order Created events
    orders.forEach((o) => {
      if (o.created_at) {
        const rev = (o.items ?? []).reduce((s: number, i: any) => s + Number(i.totalRevenue), 0)
        events.push({
          id: `created-${o.id}`,
          type: "order_created",
          title: "Order Created",
          desc: `Order #${o.id.slice(0, 8).toUpperCase()} for ${o.customer?.shop_name || o.shop_name} (₹${Math.round(rev)})`,
          date: new Date(o.created_at),
          icon: Plus,
          colorClass: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20",
        })
      }

      // 2. Order Completed events
      const s = o.status?.toLowerCase() || "pending"
      if ((s === "completed" || s === "delivered") && o.updated_at) {
        events.push({
          id: `completed-${o.id}`,
          type: "order_completed",
          title: "Order Delivered",
          desc: `Order #${o.id.slice(0, 8).toUpperCase()} successfully fulfilled for ${o.customer?.shop_name || o.shop_name}`,
          date: new Date(o.updated_at),
          icon: CheckCircle,
          colorClass: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        })
      }

      // 3. Order Updated events
      if (o.updated_at && o.created_at && new Date(o.updated_at).getTime() !== new Date(o.created_at).getTime() && s !== "completed" && s !== "delivered") {
        events.push({
          id: `updated-${o.id}`,
          type: "order_updated",
          title: "Order Status Updated",
          desc: `Order #${o.id.slice(0, 8).toUpperCase()} status changed to ${o.status.toUpperCase()}`,
          date: new Date(o.updated_at),
          icon: Clipboard,
          colorClass: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
        })
      }
    })

    // 4. Customer Added events
    customers.forEach((c) => {
      if (c.created_at) {
        events.push({
          id: `customer-${c.id}`,
          type: "customer_added",
          title: "New Shop Added",
          desc: `Registered ${c.shop_name} located in ${c.city}`,
          date: new Date(c.created_at),
          icon: UserPlus,
          colorClass: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
        })
      }
    })

    // 5. Product, Price, and Inventory updates from Catalog
    catalog.forEach((cat: any) => {
      ;(cat.products ?? []).forEach((prod: any) => {
        if (prod.updatedAt && prod.createdAt && new Date(prod.updatedAt).getTime() !== new Date(prod.createdAt).getTime()) {
          events.push({
            id: `product-updated-${prod.id}`,
            type: "product_updated",
            title: "Product Configured",
            desc: `Updated catalog info for product: ${prod.name}`,
            date: new Date(prod.updatedAt),
            icon: FileText,
            colorClass: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
          })
        }

        ;(prod.variants ?? []).forEach((v: any) => {
          // Price adjustments
          ;(v.pricingRules ?? []).forEach((pr: any) => {
            if (pr.updatedAt && pr.createdAt && new Date(pr.updatedAt).getTime() !== new Date(pr.createdAt).getTime()) {
              events.push({
                id: `price-changed-${pr.id}`,
                type: "price_changed",
                title: "Pricing Adjusted",
                desc: `Modified unit cost rules for variant ${prod.name} - ${v.name} to ₹${pr.costPrice}`,
                date: new Date(pr.updatedAt),
                icon: IndianRupee,
                colorClass: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
              })
            }
          })

          // Inventory movements
          if (v.inventoryTracked && v.updatedAt && v.createdAt && new Date(v.updatedAt).getTime() !== new Date(v.createdAt).getTime()) {
            events.push({
              id: `inventory-changed-${v.id}`,
              type: "inventory_changed",
              title: "Inventory Synced",
              desc: `Stock adjustments synced for variant ${prod.name} - ${v.name}`,
              date: new Date(v.updatedAt),
              icon: Layers,
              colorClass: "text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/20",
            })
          }
        })
      })
    })

    return events.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 8)
  }, [orders, customers, catalog])

  const formatTimeAgo = (date: Date) => {
    const diffMs = new Date().getTime() - date.getTime()
    const diffMins = Math.round(diffMs / (60 * 1000))
    const diffHours = Math.round(diffMs / (60 * 60 * 1000))
    const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000))

    if (diffMins < 60) {
      return `${Math.max(diffMins, 1)}m ago`
    } else if (diffHours < 24) {
      return `${diffHours}h ago`
    } else {
      return `${diffDays}d ago`
    }
  }

  return (
    <Card className="border border-border/80 bg-card rounded-2xl shadow-sm overflow-hidden h-full">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0 bg-muted/20 border-b border-border/60">
        <div className="space-y-1">
          <CardTitle className="text-base font-bold text-foreground">Live Activity Feed</CardTitle>
          <CardDescription className="text-xs">Real-time business audit timeline</CardDescription>
        </div>
        <Clipboard className="h-4 w-4 text-muted-foreground shrink-0" />
      </CardHeader>
      <CardContent className="p-5">
        <div className="relative border-l border-border pl-6 space-y-6">
          {feedEvents.map((event, idx) => {
            const IconComponent = event.icon
            return (
              <div key={event.id} className="relative group">
                {/* Timeline node dot */}
                <div
                  className={`absolute -left-[35px] top-0.5 p-1 rounded-lg border shrink-0 shadow-xs transition-all group-hover:scale-110 ${event.colorClass}`}
                >
                  <IconComponent className="h-3.5 w-3.5" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-bold text-foreground">{event.title}</span>
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                      {formatTimeAgo(event.date)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pr-2">
                    {event.desc}
                  </p>
                </div>
              </div>
            )
          })}
          {feedEvents.length === 0 && (
            <div className="text-center py-12 text-xs text-muted-foreground pl-0">
              No recent timeline events recorded.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
