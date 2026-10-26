"use client"

import { format } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { MapPin, Phone, Eye } from "lucide-react"
import { CustomerStatusBadge } from "./customer-status-badge"
import { CustomerActionsMenu } from "./customer-actions-menu"

interface CustomersMobileCardsProps {
  customers: any[]
  selectedCustomerIds: string[]
  onSelectCustomer: (id: string, selected: boolean) => void
  onViewProfile: (customer: any) => void
  onEdit: (customer: any) => void
  onDelete: (customer: any) => void
}

export function CustomersMobileCards({
  customers,
  selectedCustomerIds,
  onSelectCustomer,
  onViewProfile,
  onEdit,
  onDelete,
}: CustomersMobileCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-3.5">
      {customers.map((c) => {
        const isSelected = selectedCustomerIds.includes(c.id)
        let formattedDate = "Never"
        if (c.lastOrderDate) {
          try {
            formattedDate = format(new Date(c.lastOrderDate), "d MMM yyyy")
          } catch {
            formattedDate = "—"
          }
        }

        return (
          <Card
            key={c.id}
            className={`border border-border relative transition-all duration-150 rounded-xl overflow-hidden shadow-sm ${
              isSelected ? "bg-muted/40 border-ring/50" : "bg-card hover:border-border/80"
            }`}
          >
            {/* Selection Checkbox */}
            <div className="absolute top-4 left-4 z-10">
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) =>
                  onSelectCustomer(c.id, Boolean(checked))
                }
                aria-label={`Select customer ${c.shop_name}`}
              />
            </div>

            <CardContent className="p-4 pl-12 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4
                    onClick={() => onViewProfile(c)}
                    className="font-bold text-foreground text-sm hover:underline cursor-pointer transition-colors duration-150 truncate"
                  >
                    {c.shop_name}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
                      <span className="capitalize">{c.city}</span>
                    </span>
                    {c.phone && (
                      <>
                        <span className="text-muted-foreground/30 text-xs">•</span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                          <Phone className="h-3 w-3 shrink-0" />
                          <span>{c.phone}</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="shrink-0">
                  <CustomerStatusBadge status={c.status} />
                </div>
              </div>

              {/* Metrics Strip */}
              <div className="grid grid-cols-3 gap-2 bg-muted/30 dark:bg-black/20 border border-border/40 rounded-lg p-2.5 text-center">
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Orders</p>
                  <p className="text-sm font-bold text-foreground mt-0.5 font-mono">
                    {c.totalOrders}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Revenue</p>
                  <p className="text-sm font-bold text-foreground mt-0.5 font-mono">
                    ₹{c.lifetimeRevenue.toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Last Order</p>
                  <p className="text-xs font-semibold text-muted-foreground mt-1 truncate">
                    {formattedDate}
                  </p>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-muted-foreground font-mono">
                  #{c.id.slice(0, 8).toUpperCase()}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewProfile(c)}
                    className="h-8 gap-1 text-xs border-border bg-card hover:bg-muted font-medium rounded-lg"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Profile</span>
                  </Button>
                  <CustomerActionsMenu
                    customer={c}
                    onViewProfile={onViewProfile}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
