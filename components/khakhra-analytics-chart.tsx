"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { KHAKHRA_TYPES, calculatePatraProfit, type Order } from "@/lib/supabase"
import { TrendingUp, Package } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"

interface KhakhraAnalyticsProps {
  orders: Order[]
}

export function KhakhraAnalyticsChart({ orders }: KhakhraAnalyticsProps) {
  const calculateAnalytics = () => {
    const khakhraAnalytics: Record<string, { quantity: number; profit: number; revenue: number }> = {}
    const patraAnalytics = { quantity: 0, profit: 0, revenue: 0 }

    orders.forEach((order) => {
      if (order.khakhra_items) {
        order.khakhra_items.forEach((item) => {
          const khakhraType = KHAKHRA_TYPES.find((k) => k.name === item.khakhra_type)
          const profit = khakhraType ? item.quantity_kg * (khakhraType.profit || 0) : 0

          if (!khakhraAnalytics[item.khakhra_type]) {
            khakhraAnalytics[item.khakhra_type] = { quantity: 0, profit: 0, revenue: 0 }
          }

          khakhraAnalytics[item.khakhra_type].quantity += item.quantity_kg || 0
          khakhraAnalytics[item.khakhra_type].profit += profit
          khakhraAnalytics[item.khakhra_type].revenue += item.total_price || 0
        })
      }

      if (order.wants_patra && order.patra_packets > 0) {
        const patraPrice = order.patra_price_per_packet || 80
        const patraProfit = calculatePatraProfit(patraPrice)
        const patraRevenue = order.patra_packets * patraPrice

        patraAnalytics.quantity += order.patra_packets
        patraAnalytics.profit += order.patra_packets * patraProfit
        patraAnalytics.revenue += patraRevenue
      }
    })

    return { khakhraAnalytics, patraAnalytics }
  }

  const { khakhraAnalytics, patraAnalytics } = calculateAnalytics()

  // Pie chart data
  const quantityData = [
    ...Object.entries(khakhraAnalytics).map(([name, data], index) => ({
      name: name.length > 12 ? name.substring(0, 12) + "..." : name,
      fullName: name,
      value: Math.round(data.quantity * 10) / 10,
      type: "Khakhra",
      unit: "kg",
      fill: `hsl(${(index * 40) % 360}, 70%, 50%)`,
    })),
    ...(patraAnalytics.quantity > 0
      ? [
          {
            name: "Patra",
            fullName: "Patra",
            value: patraAnalytics.quantity,
            type: "Patra",
            unit: "packets",
            fill: "hsl(25, 80%, 55%)",
          },
        ]
      : []),
  ]
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)

  const profitData = [
    ...Object.entries(khakhraAnalytics).map(([name, data], index) => ({
      name: name.length > 12 ? name.substring(0, 12) + "..." : name,
      fullName: name,
      value: Math.round(data.profit),
      type: "Khakhra",
      fill: `hsl(${(index * 36 + 120) % 360}, 80%, 45%)`,
    })),
    ...(patraAnalytics.profit > 0
      ? [
          {
            name: "Patra",
            fullName: "Patra",
            value: Math.round(patraAnalytics.profit),
            type: "Patra",
            fill: "hsl(25, 85%, 50%)",
          },
        ]
      : []),
  ]
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)

  const combinedData = [
    ...Object.entries(khakhraAnalytics).map(([name, data]) => ({
      name: name.length > 8 ? name.substring(0, 8) + "..." : name,
      fullName: name,
      quantity: Math.round(data.quantity * 10) / 10,
      profit: Math.round(data.profit),
      revenue: Math.round(data.revenue),
      type: "Khakhra",
    })),
    ...(patraAnalytics.quantity > 0
      ? [
          {
            name: "Patra",
            fullName: "Patra",
            quantity: patraAnalytics.quantity,
            profit: Math.round(patraAnalytics.profit),
            revenue: Math.round(patraAnalytics.revenue),
            type: "Patra",
          },
        ]
      : []),
  ]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 8)

  const totalQuantity = quantityData.reduce((sum, item) => sum + item.value, 0)
  const totalProfit = profitData.reduce((sum, item) => sum + item.value, 0)

  // Debugging
  console.log({ khakhraAnalytics, patraAnalytics, profitData, totalProfit })

  if (quantityData.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Product Analytics
          </CardTitle>
          <CardDescription>Sales and profit analysis by product</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No sales data available yet</p>
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
          Product Analytics
        </CardTitle>
        <CardDescription>Sales and profit analysis by product (Khakhra & Patra)</CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <Tabs defaultValue="quantity" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="quantity">Most Sold</TabsTrigger>
            <TabsTrigger value="profit">Most Profitable</TabsTrigger>
            <TabsTrigger value="combined">Overview</TabsTrigger>
          </TabsList>

          {/* Most Sold */}
          <TabsContent value="quantity" className="space-y-3 mt-0">
            <div className="text-center space-y-1">
              <h3 className="text-base sm:text-lg font-semibold">Most Sold Products</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Total: {Math.round(totalQuantity * 10) / 10} units sold
              </p>
            </div>

            <div className="w-full h-[300px] sm:h-[350px]">
              <ChartContainer
                config={{ quantity: { label: "Quantity", color: "hsl(var(--chart-1))" } }}
                className="mx-auto w-full h-full"
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
                      {quantityData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload
                          return (
                            <div className="bg-background border rounded-lg p-3 shadow-lg">
                              <p className="font-medium text-sm">{d.fullName}</p>
                              <p className="text-xs text-muted-foreground">
                                {d.value} {d.unit} ({totalQuantity ? Math.round((d.value / totalQuantity) * 100) : 0}%)
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
          </TabsContent>

          {/* Most Profitable */}
          <TabsContent value="profit" className="space-y-3 mt-0">
            <div className="text-center space-y-1">
              <h3 className="text-base sm:text-lg font-semibold">Most Profitable Products</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Total: ₹{totalProfit} profit</p>
            </div>

            <div className="w-full h-[300px] sm:h-[350px]">
              <ChartContainer
                config={{ profit: { label: "Profit (₹)", color: "hsl(var(--chart-2))" } }}
                className="mx-auto w-full h-full"
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
                      {profitData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload
                          return (
                            <div className="bg-background border rounded-lg p-3 shadow-lg">
                              <p className="font-medium text-sm">{d.fullName}</p>
                              <p className="text-xs text-muted-foreground">
                                ₹{d.value} ({totalProfit ? Math.round((d.value / totalProfit) * 100) : 0}%)
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
          </TabsContent>

          {/* Combined */}
          <TabsContent value="combined" className="space-y-3 mt-0">
            <div className="text-center space-y-1">
              <h3 className="text-base sm:text-lg font-semibold">Product Performance Overview</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Quantity vs Profit comparison</p>
            </div>

            <div className="w-full h-[350px]">
              <ChartContainer
                config={{
                  quantity: { label: "Quantity", color: "hsl(var(--chart-1))" },
                  profit: { label: "Profit (₹)", color: "hsl(var(--chart-2))" },
                }}
                className="mx-auto h-full w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={combinedData} margin={{ top: 20, right: 10, left: 10, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={10} interval={0} />
                    <YAxis yAxisId="left" fontSize={10} />
                    <YAxis yAxisId="right" orientation="right" fontSize={10} />
                    <ChartTooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = combinedData.find((i) => i.name === label)
                          return (
                            <div className="bg-background border rounded-lg p-3 shadow-lg">
                              <p className="font-medium text-sm">{data?.fullName}</p>
                              <p className="text-xs text-blue-600">
                                Quantity: {data?.quantity} {data?.type === "Khakhra" ? "kg" : "packets"}
                              </p>
                              <p className="text-xs text-green-600">Profit: ₹{data?.profit}</p>
                              <p className="text-xs text-orange-600">Revenue: ₹{data?.revenue}</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar yAxisId="left" dataKey="quantity" fill="#3b82f6" name="Quantity" />
                    <Bar yAxisId="right" dataKey="profit" fill="#22c55e" name="Profit (₹)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
