"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { supabase, calculateOrderProfit, KHAKHRA_TYPES, type Order } from "@/lib/supabase"
import { IndianRupee, TrendingUp, Calendar, ShoppingCart, MapPin } from "lucide-react"
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface SummaryStats {
  totalOrders: number
  totalRevenue: number
  totalProfit: number
  totalKhakhraKg: number
  totalPatraPackets: number
  totalBhakarwadiKg: number
  totalChikkiPackets: number
  pendingOrders: number
  completedOrders: number
  khakhraProfit: number
  bhakarwadiProfit: number
  bhakriProfit: number
  faraliProfit: number
  mathiyaPuriProfit: number
  patraProfit: number
  fulvadiProfit: number
  chikkiProfit: number
}

interface MonthlyStats extends SummaryStats {
  month: string
  year: number
}

export default function SummaryPage() {
  const [stats, setStats] = useState<SummaryStats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalProfit: 0,
    totalKhakhraKg: 0,
    totalPatraPackets: 0,
    totalBhakarwadiKg: 0,
    totalChikkiPackets: 0,
    pendingOrders: 0,
    completedOrders: 0,
    khakhraProfit: 0,
    bhakarwadiProfit: 0,
    bhakriProfit: 0,
    faraliProfit: 0,
    mathiyaPuriProfit: 0,
    patraProfit: 0,
    fulvadiProfit: 0,
    chikkiProfit: 0,
  })
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    try {
      const { data: ordersData, error } = await supabase
        .from("orders")
        .select(`
          *,
          khakhra_items (*)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error

      const ordersWithItems = ordersData as Order[]

      // Calculate overall stats
      const totalStats = ordersWithItems.reduce(
        (acc, order) => {
          const { khakhraProfit, bhakarwadiProfit, bhakriProfit, faraliProfit, mathiyaPuriProfit, patraProfit, fulvadiProfit, chikkiProfit, totalProfit } = calculateOrderProfit(order)

          // Calculate specific metrics for display
          let bhakarwadiKg = 0
          let chikkiPackets = 0

          if (order.khakhra_items) {
            order.khakhra_items.forEach((item) => {
              const khakhraType = KHAKHRA_TYPES.find((k) => k.name === item.khakhra_type)
              if (khakhraType?.category === "bhakarwadi") {
                if (item.is_packet_item) {
                  bhakarwadiKg += (item.packet_quantity || 0) * 0.2
                } else {
                  bhakarwadiKg += item.quantity_kg
                }
              } else if (khakhraType?.category === "chikki") {
                if (item.is_packet_item) {
                  chikkiPackets += item.packet_quantity || 0
                }
              }
            })
          }

          return {
            totalOrders: acc.totalOrders + 1,
            totalRevenue: acc.totalRevenue + order.total_amount,
            totalProfit: acc.totalProfit + totalProfit,
            totalKhakhraKg: acc.totalKhakhraKg + order.total_khakhra_kg,
            totalPatraPackets: acc.totalPatraPackets + order.patra_packets,
            totalBhakarwadiKg: acc.totalBhakarwadiKg + bhakarwadiKg,
            totalChikkiPackets: acc.totalChikkiPackets + chikkiPackets + (order.chikki_packets || 0),
            pendingOrders: acc.pendingOrders + (order.status === "pending" ? 1 : 0),
            completedOrders: acc.completedOrders + (order.status === "completed" ? 1 : 0),
            khakhraProfit: acc.khakhraProfit + khakhraProfit,
            bhakarwadiProfit: acc.bhakarwadiProfit + bhakarwadiProfit,
            bhakriProfit: acc.bhakriProfit + bhakriProfit,
            faraliProfit: acc.faraliProfit + faraliProfit,
            mathiyaPuriProfit: acc.mathiyaPuriProfit + mathiyaPuriProfit,
            patraProfit: acc.patraProfit + patraProfit,
            fulvadiProfit: acc.fulvadiProfit + fulvadiProfit,
            chikkiProfit: acc.chikkiProfit + chikkiProfit,
          }
        },
        {
          totalOrders: 0,
          totalRevenue: 0,
          totalProfit: 0,
          totalKhakhraKg: 0,
          totalPatraPackets: 0,
          totalBhakarwadiKg: 0,
          totalChikkiPackets: 0,
          pendingOrders: 0,
          completedOrders: 0,
          khakhraProfit: 0,
          bhakarwadiProfit: 0,
          bhakriProfit: 0,
          faraliProfit: 0,
          mathiyaPuriProfit: 0,
          patraProfit: 0,
          fulvadiProfit: 0,
          chikkiProfit: 0,
        },
      )

      setStats(totalStats)
      setOrders(ordersWithItems)

      // Calculate monthly stats for the last 12 months
      const now = new Date()
      const twelveMonthsAgo = subMonths(now, 11)
      const months = eachMonthOfInterval({ start: twelveMonthsAgo, end: now })

      const monthlyData = months.map((month) => {
        const monthStart = startOfMonth(month)
        const monthEnd = endOfMonth(month)

        const monthOrders = ordersWithItems.filter((order) => {
          const orderDate = new Date(order.created_at)
          return orderDate >= monthStart && orderDate <= monthEnd
        })

        const monthStats = monthOrders.reduce(
          (acc, order) => {
            const { khakhraProfit, bhakarwadiProfit, bhakriProfit, faraliProfit, mathiyaPuriProfit, patraProfit, fulvadiProfit, chikkiProfit, totalProfit } = calculateOrderProfit(order)

            let bhakarwadiKg = 0
            let chikkiPackets = 0

            if (order.khakhra_items) {
              order.khakhra_items.forEach((item) => {
                const khakhraType = KHAKHRA_TYPES.find((k) => k.name === item.khakhra_type)
                if (khakhraType?.category === "bhakarwadi") {
                  if (item.is_packet_item) {
                    bhakarwadiKg += (item.packet_quantity || 0) * 0.2
                  } else {
                    bhakarwadiKg += item.quantity_kg
                  }
                } else if (khakhraType?.category === "chikki") {
                  if (item.is_packet_item) {
                    chikkiPackets += item.packet_quantity || 0
                  }
                }
              })
            }

            return {
              totalOrders: acc.totalOrders + 1,
              totalRevenue: acc.totalRevenue + order.total_amount,
              totalProfit: acc.totalProfit + totalProfit,
              totalKhakhraKg: acc.totalKhakhraKg + order.total_khakhra_kg,
              totalPatraPackets: acc.totalPatraPackets + order.patra_packets,
              totalBhakarwadiKg: acc.totalBhakarwadiKg + bhakarwadiKg,
              totalChikkiPackets: acc.totalChikkiPackets + chikkiPackets + (order.chikki_packets || 0),
              pendingOrders: acc.pendingOrders + (order.status === "pending" ? 1 : 0),
              completedOrders: acc.completedOrders + (order.status === "completed" ? 1 : 0),
              khakhraProfit: acc.khakhraProfit + khakhraProfit,
              bhakarwadiProfit: acc.bhakarwadiProfit + bhakarwadiProfit,
              bhakriProfit: acc.bhakriProfit + bhakriProfit,
              faraliProfit: acc.faraliProfit + faraliProfit,
              mathiyaPuriProfit: acc.mathiyaPuriProfit + mathiyaPuriProfit,
              patraProfit: acc.patraProfit + patraProfit,
              fulvadiProfit: acc.fulvadiProfit + fulvadiProfit,
              chikkiProfit: acc.chikkiProfit + chikkiProfit,
            }
          },
          {
            totalOrders: 0,
            totalRevenue: 0,
            totalProfit: 0,
            totalKhakhraKg: 0,
            totalPatraPackets: 0,
            totalBhakarwadiKg: 0,
            totalChikkiPackets: 0,
            pendingOrders: 0,
            completedOrders: 0,
            khakhraProfit: 0,
            bhakarwadiProfit: 0,
            bhakriProfit: 0,
            faraliProfit: 0,
            mathiyaPuriProfit: 0,
            patraProfit: 0,
            fulvadiProfit: 0,
            chikkiProfit: 0,
            month: format(month, "MMMM"),
            year: month.getFullYear(),
          },
        )

        return {
          ...monthStats,
          month: format(month, "MMMM"),
          year: month.getFullYear(),
        }
      })

      setMonthlyStats(monthlyData)
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading summary...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Business Summary</h1>
        <Badge variant="outline" className="text-sm">
          Last updated: {format(new Date(), "PPp")}
        </Badge>
      </div>

      <Tabs defaultValue="overall" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overall">Overall Summary</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="overall" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {stats.pendingOrders} pending
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {stats.completedOrders} completed
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Avg: ₹{stats.totalOrders > 0 ? Math.round(stats.totalRevenue / stats.totalOrders) : 0} per order
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overall Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">₹{stats.totalProfit.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.totalRevenue > 0 ? ((stats.totalProfit / stats.totalRevenue) * 100).toFixed(1) : 0}% margin
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Products Sold</CardTitle>
                <CardDescription>Quantity sold by product category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalKhakhraKg.toFixed(1)} kg</div>
                <p className="text-xs text-muted-foreground mt-1">
                  + {stats.totalPatraPackets} Patra + {stats.totalChikkiPackets} Chikki
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Sales Breakdown</CardTitle>
                <CardDescription>Quantity sold by product category</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Khakhra (Total)</span>
                  <span className="text-sm">{stats.totalKhakhraKg.toFixed(1)} kg</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Patra Packets</span>
                  <span className="text-sm">{stats.totalPatraPackets} packets</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Bhakarwadi</span>
                  <span className="text-sm">{stats.totalBhakarwadiKg.toFixed(1)} kg</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Chikki Packets</span>
                  <span className="text-sm">{stats.totalChikkiPackets} packets (200g each)</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profit Breakdown</CardTitle>
                <CardDescription>Profit by product category</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Khakhra Profit</span>
                  <span className="text-sm font-semibold text-green-600">₹{stats.khakhraProfit.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Bhakarwadi Profit</span>
                  <span className="text-sm font-semibold text-green-600">
                    ₹{stats.bhakarwadiProfit.toLocaleString()}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Bhakri Profit</span>
                  <span className="text-sm font-semibold text-green-600">₹{stats.bhakriProfit.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Farali Profit</span>
                  <span className="text-sm font-semibold text-green-600">₹{stats.faraliProfit.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Mathiya Puri Profit</span>
                  <span className="text-sm font-semibold text-green-600">₹{stats.mathiyaPuriProfit.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Patra Profit</span>
                  <span className="text-sm font-semibold text-green-600">₹{stats.patraProfit.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Fulvadi Profit</span>
                  <span className="text-sm font-semibold text-green-600">₹{stats.fulvadiProfit.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Chikki Profit</span>
                  <span className="text-sm font-semibold text-green-600">₹{stats.chikkiProfit.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-sm">Overall Profit</span>
                  <span className="text-sm text-green-600">₹{stats.totalProfit.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Monthly Performance (Last 12 Months)
              </CardTitle>
              <CardDescription>
                Month-wise breakdown of orders, revenue, and profit. Click to expand and view all orders.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {monthlyStats.map((monthData, index) => {
                  // Get all orders for this month
                  const monthOrders = orders.filter((order) => {
                    const orderDate = new Date(order.created_at)
                    const orderMonth = orderDate.getMonth()
                    const orderYear = orderDate.getFullYear()
                    const statsMonth = new Date(`${monthData.month} 1, ${monthData.year}`).getMonth()
                    const statsYear = monthData.year
                    return orderMonth === statsMonth && orderYear === statsYear
                  })

                  return (
                    <AccordionItem key={index} value={`month-${index}`} className="border rounded-lg mb-4">
                      <AccordionTrigger className="hover:no-underline p-4 hover:bg-muted/50">
                        <div className="flex items-center justify-between w-full mr-4">
                          <h3 className="font-semibold text-lg">
                            {monthData.month} {monthData.year}
                          </h3>
                          <div className="flex items-center gap-4 text-sm">
                            <Badge variant={monthData.totalOrders > 0 ? "default" : "secondary"}>
                              {monthData.totalOrders} orders
                            </Badge>
                            <span className="font-semibold text-green-600">
                              ₹{monthData.totalProfit.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </AccordionTrigger>

                      <AccordionContent className="p-4 border-t">
                        {monthData.totalOrders > 0 ? (
                          <div className="space-y-4">
                            {/* Month Stats Summary */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                              <div>
                                <p className="text-muted-foreground text-xs">Revenue</p>
                                <p className="font-semibold">₹{monthData.totalRevenue.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Profit</p>
                                <p className="font-semibold text-green-600">
                                  ₹{monthData.totalProfit.toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Khakhra Sold</p>
                                <p className="font-semibold">{monthData.totalKhakhraKg.toFixed(1)} kg</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Profit Margin</p>
                                <p className="font-semibold">
                                  {monthData.totalRevenue > 0
                                    ? ((monthData.totalProfit / monthData.totalRevenue) * 100).toFixed(1)
                                    : 0}
                                  %
                                </p>
                              </div>
                            </div>

                            {/* Orders List */}
                            <div className="space-y-3">
                              <h4 className="font-semibold text-sm">Orders in {monthData.month}</h4>
                              <div className="space-y-2 max-h-96 overflow-y-auto">
                                {monthOrders.map((order) => {
                                  const orderProfit = calculateOrderProfit(order)
                                  return (
                                    <div
                                      key={order.id}
                                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors space-y-3"
                                    >
                                      {/* Order Header */}
                                      <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                          <p className="font-semibold text-sm">{order.shop_name}</p>
                                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                            <MapPin className="h-3 w-3" />
                                            <span>{order.city}</span>
                                            <span>•</span>
                                            <span>{format(new Date(order.created_at), "MMM dd, yyyy")}</span>
                                          </div>
                                        </div>
                                        <Badge
                                          variant={order.status === "completed" ? "default" : "secondary"}
                                          className="text-xs"
                                        >
                                          {order.status}
                                        </Badge>
                                      </div>

                                      <Separator className="my-2" />

                                      {/* Items Breakdown */}
                                      <div className="space-y-2">
                                        <p className="font-medium text-sm">Items Ordered:</p>

                                        {/* Khakhra Items */}
                                        {order.khakhra_items && order.khakhra_items.length > 0 && (
                                          <div className="space-y-1 ml-2">
                                            {order.khakhra_items.map((item) => (
                                              <div key={item.id} className="text-xs">
                                                <div className="flex justify-between">
                                                  <span className="text-muted-foreground">{item.khakhra_type}:</span>
                                                  <span className="font-medium">
                                                    {item.is_packet_item
                                                      ? `${item.packet_quantity} packets`
                                                      : `${item.quantity_kg} kg`}
                                                  </span>
                                                </div>
                                                <div className="flex justify-between text-muted-foreground text-xs ml-2">
                                                  <span>
                                                    @ ₹{item.is_packet_item ? item.price_per_packet : item.price_per_kg}
                                                    {item.is_packet_item ? "/packet" : "/kg"}
                                                  </span>
                                                  <span>= ₹{item.total_price}</span>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}

                                        {/* Patra */}
                                        {order.wants_patra && order.patra_packets > 0 && (
                                          <div className="text-xs ml-2">
                                            <div className="flex justify-between">
                                              <span className="text-muted-foreground">Patra:</span>
                                              <span className="font-medium">{order.patra_packets} packets</span>
                                            </div>
                                            <div className="flex justify-between text-muted-foreground text-xs ml-2">
                                              <span>@ ₹{order.patra_price_per_packet || 75}/packet</span>
                                              <span>
                                                = ₹{order.patra_packets * (order.patra_price_per_packet || 75)}
                                              </span>
                                            </div>
                                          </div>
                                        )}

                                        {/* Fulvadi */}
                                        {order.wants_fulvadi && order.fulvadi_packets && order.fulvadi_packets > 0 && (
                                          <div className="text-xs ml-2">
                                            <div className="flex justify-between">
                                              <span className="text-muted-foreground">Fulvadi (500g):</span>
                                              <span className="font-medium">{order.fulvadi_packets} packets</span>
                                            </div>
                                            <div className="flex justify-between text-muted-foreground text-xs ml-2">
                                              <span>@ ₹{order.fulvadi_price_per_packet || 90}/packet</span>
                                              <span>
                                                = ₹{order.fulvadi_packets * (order.fulvadi_price_per_packet || 90)}
                                              </span>
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                      <Separator className="my-2" />

                                      {/* Order Summary */}
                                      <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                          <div className="flex justify-between gap-6 text-sm">
                                            <span className="text-muted-foreground">Total Amount:</span>
                                            <span className="font-semibold">₹{order.total_amount}</span>
                                          </div>
                                          <div className="flex justify-between gap-6 text-sm">
                                            <span className="text-muted-foreground">Total Profit:</span>
                                            <span className="font-semibold text-green-600">
                                              +₹{orderProfit.totalProfit.toFixed(0)}
                                            </span>
                                          </div>
                                          <div className="flex justify-between gap-6 text-xs text-muted-foreground">
                                            <span>Profit Margin:</span>
                                            <span>
                                              {order.total_amount > 0
                                                ? ((orderProfit.totalProfit / order.total_amount) * 100).toFixed(1)
                                                : 0}
                                              %
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-sm text-center py-4">No orders this month</p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
