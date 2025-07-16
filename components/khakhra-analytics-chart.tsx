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
  // Calculate analytics data including Patra
  const calculateAnalytics = () => {
    const khakhraAnalytics: Record<string, { quantity: number; profit: number; revenue: number }> = {}
    const patraAnalytics = { quantity: 0, profit: 0, revenue: 0 }

    orders.forEach((order) => {
      // Process Khakhra items
      if (order.khakhra_items) {
        order.khakhra_items.forEach((item) => {
          const khakhraType = KHAKHRA_TYPES.find((k) => k.name === item.khakhra_type)
          const profit = khakhraType ? item.quantity_kg * khakhraType.profit : 0

          if (!khakhraAnalytics[item.khakhra_type]) {
            khakhraAnalytics[item.khakhra_type] = { quantity: 0, profit: 0, revenue: 0 }
          }

          khakhraAnalytics[item.khakhra_type].quantity += item.quantity_kg
          khakhraAnalytics[item.khakhra_type].profit += profit
          khakhraAnalytics[item.khakhra_type].revenue += item.total_price
        })
      }

      // Process Patra
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

  // Prepare data for quantity chart (most sold) - including Patra
  const quantityData = [
    ...Object.entries(khakhraAnalytics).map(([name, data]) => ({
      name: name.length > 12 ? name.substring(0, 12) + "..." : name,
      fullName: name,
      value: Math.round(data.quantity * 10) / 10,
      type: "Khakhra",
      unit: "kg",
      fill: `hsl(${Math.abs(name.split("").reduce((a, b) => a + b.charCodeAt(0), 0)) % 360}, 70%, 50%)`,
    })),
    ...(patraAnalytics.quantity > 0
      ? [
          {
            name: "Patra",
            fullName: "Patra",
            value: patraAnalytics.quantity,
            type: "Patra",
            unit: "packets",
            fill: "hsl(25, 80%, 55%)", // Orange color for Patra
          },
        ]
      : []),
  ]
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)

  // Prepare data for profit chart - including Patra
  const profitData = [
    ...Object.entries(khakhraAnalytics).map(([name, data]) => ({
      name: name.length > 12 ? name.substring(0, 12) + "..." : name,
      fullName: name,
      value: Math.round(data.profit),
      type: "Khakhra",
      fill: `hsl(${Math.abs(name.split("").reduce((a, b) => a + b.charCodeAt(0), 0)) % 360}, 80%, 45%)`,
    })),
    ...(patraAnalytics.profit > 0
      ? [
          {
            name: "Patra",
            fullName: "Patra",
            value: Math.round(patraAnalytics.profit),
            type: "Patra",
            fill: "hsl(25, 85%, 50%)", // Orange color for Patra
          },
        ]
      : []),
  ]
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)

  // Prepare data for bar chart (combined view) - including Patra
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
            <TabsTrigger value="quantity" className="text-xs sm:text-sm">
              Most Sold
            </TabsTrigger>
            <TabsTrigger value="profit" className="text-xs sm:text-sm">
              Most Profitable
            </TabsTrigger>
            <TabsTrigger value="combined" className="text-xs sm:text-sm">
              Overview
            </TabsTrigger>
          </TabsList>

          {/* Most Sold Pie Chart */}
          <TabsContent value="quantity" className="space-y-3 mt-0">
            <div className="text-center space-y-1">
              <h3 className="text-base sm:text-lg font-semibold">Most Sold Products</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Total: {Math.round(totalQuantity * 10) / 10} units sold
              </p>
            </div>

            <div className="w-full">
              <ChartContainer
                config={{
                  quantity: {
                    label: "Quantity",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="mx-auto h-[250px] sm:h-[350px] w-full"
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
                                {data.value} {data.unit} ({Math.round((data.value / totalQuantity) * 100)}%)
                              </p>
                              <p className="text-xs text-blue-600">{data.type}</p>
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
                    {item.fullName}: {item.value}
                    {item.unit === "kg" ? "kg" : " packets"}
                  </span>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Most Profitable Pie Chart */}
          <TabsContent value="profit" className="space-y-3 mt-0">
            <div className="text-center space-y-1">
              <h3 className="text-base sm:text-lg font-semibold">Most Profitable Products</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Total: ₹{totalProfit} profit</p>
            </div>

            <div className="w-full">
              <ChartContainer
                config={{
                  profit: {
                    label: "Profit (₹)",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="mx-auto h-[250px] sm:h-[350px] w-full"
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
                              <p className="text-xs text-green-600">{data.type}</p>
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

          {/* Combined Bar Chart */}
          <TabsContent value="combined" className="space-y-3 mt-0">
            <div className="text-center space-y-1">
              <h3 className="text-base sm:text-lg font-semibold">Product Performance Overview</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Quantity vs Profit comparison</p>
            </div>

            <div className="w-full">
              <ChartContainer
                config={{
                  quantity: {
                    label: "Quantity",
                    color: "hsl(var(--chart-1))",
                  },
                  profit: {
                    label: "Profit (₹)",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="mx-auto h-[250px] sm:h-[350px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={combinedData}
                    margin={{
                      top: 20,
                      right: 10,
                      left: 10,
                      bottom: 60,
                    }}
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
                              <p className="text-xs text-blue-600">
                                Quantity: {data?.quantity} {data?.type === "Khakhra" ? "kg" : "packets"}
                              </p>
                              <p className="text-xs text-green-600">Profit: ₹{data?.profit}</p>
                              <p className="text-xs text-orange-600">Revenue: ₹{data?.revenue}</p>
                              <p className="text-xs text-purple-600">Type: {data?.type}</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar yAxisId="left" dataKey="quantity" fill="var(--color-quantity)" name="Quantity" />
                    <Bar yAxisId="right" dataKey="profit" fill="var(--color-profit)" name="Profit (₹)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            {/* Legend for mobile */}
            <div className="flex flex-wrap justify-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>Quantity</span>
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
