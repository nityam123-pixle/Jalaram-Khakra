import { CheckCircle2, Clock, IndianRupee, ShoppingCart, TrendingDownIcon, TrendingUpIcon } from "lucide-react"

import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Trend = { value: string; positive?: boolean; negative?: boolean; neutral?: boolean }

export function SectionCards({
  totalOrders,
  pendingOrders,
  completedOrders,
  totalEarningsFormatted,
}: {
  totalOrders: number
  pendingOrders: number
  completedOrders: number
  totalEarningsFormatted: string
}) {
  const cards: {
    title: string
    value: string
    description: string
    icon: typeof ShoppingCart
    trend?: Trend
  }[] = [
    {
      title: "Total Orders",
      value: totalOrders.toLocaleString("en-IN"),
      description: "All time orders",
      icon: ShoppingCart,
      trend: { value: "+12% from last month", positive: true },
    },
    {
      title: "Pending Orders",
      value: pendingOrders.toLocaleString("en-IN"),
      description: "Awaiting completion",
      icon: Clock,
      trend: { value: "In queue", neutral: true },
    },
    {
      title: "Completed Orders",
      value: completedOrders.toLocaleString("en-IN"),
      description: "Successfully delivered",
      icon: CheckCircle2,
      trend: { value: "+8% from last month", positive: true },
    },
    {
      title: "Total Earnings ₹",
      value: totalEarningsFormatted,
      description: "Revenue generated",
      icon: IndianRupee,
      trend: { value: "+15% from last month", positive: true },
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 px-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 lg:px-6">
      {cards.map((card) => (
        <Card
          key={card.title}
          className="stat-card @container/card rounded-xl border border-border bg-transparent shadow-none"
          data-slot="card"
        >
          <CardHeader className="relative pb-2">
            <CardDescription>{card.title}</CardDescription>
            <CardTitle
              className={cn(
                "pr-14 font-mono text-3xl font-semibold tracking-tight tabular-nums @[250px]/card:text-3xl",
              )}
            >
              {card.value}
            </CardTitle>
            <div className="absolute right-4 top-4 rounded-lg bg-muted p-2 text-muted-foreground">
              <card.icon className="size-4" strokeWidth={1.5} />
            </div>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1 border-0 pt-0 text-sm">
            {card.trend && (
              <span
                className={cn(
                  "inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                  card.trend.positive &&
                    "bg-green-500/10 text-green-600 dark:text-green-400",
                  card.trend.negative && "bg-red-500/10 text-red-600 dark:text-red-400",
                  card.trend.neutral && "bg-muted text-muted-foreground",
                )}
              >
                {!card.trend.neutral &&
                  (card.trend.positive ? (
                    <TrendingUpIcon className="size-3" />
                  ) : (
                    <TrendingDownIcon className="size-3" />
                  ))}
                {card.trend.value}
              </span>
            )}
            <div className="line-clamp-1 text-muted-foreground">{card.description}</div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
