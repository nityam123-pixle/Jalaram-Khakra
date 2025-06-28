"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { KHAKHRA_TYPES, type Order } from "@/lib/supabase"
import { TrendingUp, Package } from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"

interface KhakhraAnalyticsProps {
  orders: Order[]
}

export function KhakhraAnalyticsChart({ orders }: KhakhraAnalyticsProps) {
  const calculateAnalytics = () => {
    const analytics: Record<string, { quantity: number; profit: number; revenue: number }> = {}

    orders.forEach((order) => {
      if (order.khakhra_items) {
        order.khakhra_items.forEach((item) => {
          const khakhraType = KHAKHRA_TYPES.find((k) => k.name === item.khakhra_type)
          const profit = khakhraType ? item.quantity_kg * khakhraType.profit : 0

          if (!analytics[item.khakhra_type]) {
            analytics[item.khakhra_type] = { quantity: 0, profit: 0, revenue: 0 }
          }

          analytics[item.khakhra_type].quantity += item.quantity_kg
          analytics[item.khakhra_type].profit += profit
          analytics[item.khakhra_type].revenue += item.total_price
        })
      }
    })

    return analytics
  }

  const analytics = calculateAnalytics()

  const quantityData = Object.entries(analytics)
    .map(([name, data]) => ({
      name: name.length > 12 ? name.substring(0, 12) + "..." : name,
      fullName: name,
      value: Math.round(data.quantity * 10) / 10,
      fill: `hsl(${Math.abs(name.split("").reduce((a, b) => a + b.charCodeAt(0), 0)) % 360}, 70%, 50%)`,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  const profitData = Object.entries(analytics)
    .map(([name, data]) => ({
      name: name.length > 12 ? name.substring(0, 12) + "..." : name,
      fullName: name,
      value: Math.round(data.profit),
      fill: `hsl(${Math.abs(name.split("").reduce((a, b) => a + b.charCodeAt(0), 0)) % 360}, 80%, 45%)`,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  const combinedData = Object.entries(analytics)
    .map(([name, data]) => ({
      name: name.length > 8 ? name.substring(0, 8) + "..." : name,
      fullName: name,
      quantity: Math.round(data.quantity * 10) / 10,
      profit: Math.round(data.profit),
      revenue: Math.round(data.revenue),
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 6)

  const totalQuantity = quantityData.reduce((sum, item) => sum + item.value, 0)
  const totalProfit = profitData.reduce((sum, item) => sum + item.value, 0)

  if (quantityData.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Khakhra Analytics
          </CardTitle>
          <CardDescription>Sales and profit analysis by flavor</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No Khakhra sales data available yet</p>
            <p className="text-sm">Create some orders to see analytics</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Khakhra Analytics
        </CardTitle>
        <CardDescription>Sales and profit analysis by flavor</CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 overflow-x-auto">
        <Tabs defaultValue="quantity" className="w-full">
          <div className="overflow-x-auto">
            <TabsList className="grid min-w-[340px] grid-cols-3 gap-1 mb-4 text-xs sm:text-sm">
              <TabsTrigger value="quantity">Most Sold</TabsTrigger>
              <TabsTrigger value="profit">Most Profitable</TabsTrigger>
              <TabsTrigger value="combined">Overview</TabsTrigger>
            </TabsList>
          </div>

          {/* --- Quantity Chart --- */}
          <TabsContent value="quantity" className="space-y-3 mt-0">
            <div className="text-center space-y-1">
              <h3 className="text-base sm:text-lg font-semibold">Most Sold Khakhra Flavors</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Total: {totalQuantity} kg sold</p>
            </div>

            <div className="w-full overflow-x-auto">
              <ChartContainer
                config={{
                  quantity: {
                    label: "Quantity (kg)",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="mx-auto min-w-[300px] h-[250px] sm:h-[350px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={quantityData}
                      cx="50%"
                      cy="50%"
                      outerRadius="80%"
                      innerRadius="40%"
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {quantityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-background border rounded-lg p-3 shadow-lg">
                              <p className="font-medium text-sm">{data.fullName}</p>
                              <p className="text-xs text-muted-foreground">
                                {data.value} kg ({Math.round((data.value / totalQuantity) * 100)}%)
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {quantityData.map((item, index) => (
                <div key={index} className="flex items-center gap-2 p-2 rounded border">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.fill }} />
                  <span className="truncate text-xs">
                    {item.fullName}: {item.value}kg
                  </span>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* --- Profit Chart --- */}
          <TabsContent value="profit" className="space-y-3 mt-0">
            <div className="text-center space-y-1">
              <h3 className="text-base sm:text-lg font-semibold">Most Profitable Khakhra Flavors</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Total: ₹{totalProfit} profit</p>
            </div>

            <div className="w-full overflow-x-auto">
              <ChartContainer
                config={{
                  profit: {
                    label: "Profit (₹)",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="mx-auto min-w-[300px] max-w-full h-[250px] sm:h-[350px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={profitData}
                      cx="50%"
                      cy="50%"
                      outerRadius="80%"
                      innerRadius="40%"
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {profitData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-background border rounded-lg p-3 shadow-lg">
                              <p className="font-medium text-sm">{data.fullName}</p>
                              <p className="text-xs text-muted-foreground">
                                ₹{data.value} ({Math.round((data.value / totalProfit) * 100)}%)
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {profitData.map((item, index) => (
                <div key={index} className="flex items-center gap-2 p-2 rounded border">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.fill }} />
                  <span className="truncate text-xs">
                    {item.fullName}: ₹{item.value}
                  </span>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* --- Combined Chart --- */}
          <TabsContent value="combined" className="space-y-3 mt-0">
            <div className="text-center space-y-1">
              <h3 className="text-base sm:text-lg font-semibold">Khakhra Performance Overview</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Quantity vs Profit comparison</p>
            </div>

            <div className="w-full overflow-x-auto">
              <ChartContainer
                config={{
                  quantity: {
                    label: "Quantity (kg)",
                    color: "hsl(var(--chart-1))",
                  },
                  profit: {
                    label: "Profit (₹)",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="mx-auto min-w-[300px] h-[250px] sm:h-[350px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={combinedData}
                    margin={{ top: 20, right: 10, left: 10, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={10} interval={0} />
                    <YAxis yAxisId="left" orientation="left" fontSize={10} />
                    <YAxis yAxisId="right" orientation="right" fontSize={10} />
                    <ChartTooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = combinedData.find((item) => item.name === label)
                          return (
                            <div className="bg-background border rounded-lg p-3 shadow-lg">
                              <p className="font-medium text-sm">{data?.fullName}</p>
                              <p className="text-xs text-blue-600">Quantity: {data?.quantity} kg</p>
                              <p className="text-xs text-green-600">Profit: ₹{data?.profit}</p>
                              <p className="text-xs text-orange-600">Revenue: ₹{data?.revenue}</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar yAxisId="left" dataKey="quantity" fill="var(--color-quantity)" name="Quantity (kg)" />
                    <Bar yAxisId="right" dataKey="profit" fill="var(--color-profit)" name="Profit (₹)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            <div className="flex flex-wrap justify-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>Quantity (kg)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Profit (₹)</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
