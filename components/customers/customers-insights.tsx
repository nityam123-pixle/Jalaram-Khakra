"use client"

import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Crown, BarChart2, Calendar, UserPlus } from "lucide-react"

interface CustomerInsightsProps {
  stats: {
    topCity?: string
    topCustomer?: string
    avgOrderValue?: number
    customersThisMonth?: number
    newCustomers?: number
  }
}

export function CustomersInsights({ stats }: CustomerInsightsProps) {
  const items = [
    {
      label: "TOP CITY",
      value: stats.topCity || "Savarkundla",
      icon: MapPin,
    },
    {
      label: "TOP CUSTOMER",
      value: stats.topCustomer || "Ajanta Cream Corner",
      icon: Crown,
    },
    {
      label: "AVG ORDER VALUE",
      value: `₹${(stats.avgOrderValue || 0).toLocaleString("en-IN")}`,
      icon: BarChart2,
    },
    {
      label: "CUSTOMERS THIS MONTH",
      value: (stats.customersThisMonth ?? 0).toString(),
      icon: Calendar,
    },
    {
      label: "NEW CUSTOMERS",
      value: (stats.newCustomers ?? 0).toString(),
      icon: UserPlus,
    },
  ]

  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      {items.map((item, idx) => {
        const IconComponent = item.icon
        return (
          <Card
            key={idx}
            className="border border-border bg-card shadow-sm rounded-xl overflow-hidden hover:border-ring/30 transition-colors"
          >
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider truncate">
                  {item.label}
                </p>
                <p className="text-sm sm:text-base font-bold text-foreground mt-0.5 truncate font-mono">
                  {item.value}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-muted/60 dark:bg-secondary/40 text-muted-foreground border border-border/40 shrink-0">
                <IconComponent className="h-3.5 w-3.5" />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
