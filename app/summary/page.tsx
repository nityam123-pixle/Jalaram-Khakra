import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { IndianRupee, TrendingUp, Calendar, ShoppingCart, MapPin } from "lucide-react"
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { getSummaryOrders } from "../actions/analytics"

export default async function SummaryPage() {
  const orders = await getSummaryOrders()

  // Calculate overall stats
  const stats = orders.reduce(
    (acc, order) => {
      let orderProfit = 0;
      let orderRevenue = 0;
      let orderKhakhraKg = 0;
      let orderBhakarwadiKg = 0;
      let orderChikkiPackets = 0;
      let orderPatraPackets = 0;
      
      const profitByCat: Record<string, number> = {}

      order.items.forEach(item => {
        orderProfit += Number(item.totalProfit) || 0
        orderRevenue += Number(item.totalRevenue) || 0
        
        const catName = item.categoryName
        profitByCat[catName] = (profitByCat[catName] || 0) + (Number(item.totalProfit) || 0)

        // Basic approximations based on category names for UI
        if (catName.toLowerCase().includes('khakhra')) {
           orderKhakhraKg += item.quantity
        } else if (catName.toLowerCase().includes('bhakarwadi')) {
           orderBhakarwadiKg += item.quantity
        } else if (catName.toLowerCase().includes('chikki')) {
           orderChikkiPackets += item.quantity
        } else if (catName.toLowerCase().includes('patra')) {
           orderPatraPackets += item.quantity
        }
      })

      Object.entries(profitByCat).forEach(([cat, val]) => {
         acc.profitByCat[cat] = (acc.profitByCat[cat] || 0) + val
      })

      return {
        totalOrders: acc.totalOrders + 1,
        totalRevenue: acc.totalRevenue + orderRevenue,
        totalProfit: acc.totalProfit + orderProfit,
        totalKhakhraKg: acc.totalKhakhraKg + orderKhakhraKg,
        totalPatraPackets: acc.totalPatraPackets + orderPatraPackets,
        totalBhakarwadiKg: acc.totalBhakarwadiKg + orderBhakarwadiKg,
        totalChikkiPackets: acc.totalChikkiPackets + orderChikkiPackets,
        pendingOrders: acc.pendingOrders + (order.status === "pending" ? 1 : 0),
        completedOrders: acc.completedOrders + (order.status === "completed" ? 1 : 0),
        profitByCat: acc.profitByCat
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
      profitByCat: {} as Record<string, number>
    }
  )

  // Calculate monthly stats for the last 12 months
  const now = new Date()
  const twelveMonthsAgo = subMonths(now, 11)
  const months = eachMonthOfInterval({ start: twelveMonthsAgo, end: now })

  const monthlyStats = months.map((month) => {
    const monthStart = startOfMonth(month)
    const monthEnd = endOfMonth(month)

    const monthOrders = orders.filter((order) => {
      const orderDate = new Date(order.created_at)
      return orderDate >= monthStart && orderDate <= monthEnd
    })

    const monthStats = monthOrders.reduce(
      (acc, order) => {
        let orderProfit = 0;
        let orderRevenue = 0;
        let orderKhakhraKg = 0;
        order.items.forEach(item => {
          orderProfit += Number(item.totalProfit) || 0
          orderRevenue += Number(item.totalRevenue) || 0
          if (item.categoryName.toLowerCase().includes('khakhra')) {
             orderKhakhraKg += item.quantity
          }
        })

        return {
          totalOrders: acc.totalOrders + 1,
          totalRevenue: acc.totalRevenue + orderRevenue,
          totalProfit: acc.totalProfit + orderProfit,
          totalKhakhraKg: acc.totalKhakhraKg + orderKhakhraKg,
        }
      },
      {
        totalOrders: 0,
        totalRevenue: 0,
        totalProfit: 0,
        totalKhakhraKg: 0,
      }
    )

    return {
      ...monthStats,
      month: format(month, "MMMM"),
      year: month.getFullYear(),
      monthOrders
    }
  })

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
                <div className="text-2xl font-bold">₹{Math.round(stats.totalRevenue).toLocaleString()}</div>
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
                <div className="text-2xl font-bold text-green-600">₹{Math.round(stats.totalProfit).toLocaleString()}</div>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Profit Breakdown</CardTitle>
                <CardDescription>Profit by dynamic product categories</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(stats.profitByCat)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, val]) => (
                    <div key={cat}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{cat}</span>
                        <span className="text-sm font-semibold text-green-600">
                          ₹{Math.round(val).toLocaleString()}
                        </span>
                      </div>
                      <Separator className="my-3" />
                    </div>
                ))}
                
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-sm">Overall Profit</span>
                  <span className="text-sm text-green-600">₹{Math.round(stats.totalProfit).toLocaleString()}</span>
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
                              ₹{Math.round(monthData.totalProfit).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </AccordionTrigger>

                      <AccordionContent className="p-4 border-t">
                        {monthData.totalOrders > 0 ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                              <div>
                                <p className="text-muted-foreground text-xs">Revenue</p>
                                <p className="font-semibold">₹{Math.round(monthData.totalRevenue).toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Profit</p>
                                <p className="font-semibold text-green-600">
                                  ₹{Math.round(monthData.totalProfit).toLocaleString()}
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

                            <div className="space-y-3">
                              <h4 className="font-semibold text-sm">Orders in {monthData.month}</h4>
                              <div className="space-y-2 max-h-96 overflow-y-auto">
                                {monthData.monthOrders.map((order) => {
                                  let orderProfit = 0;
                                  order.items.forEach(i => orderProfit += Number(i.totalProfit));

                                  return (
                                    <div
                                      key={order.id}
                                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors space-y-3"
                                    >
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

                                      <div className="space-y-2">
                                        <p className="font-medium text-sm">Items Ordered:</p>
                                        <div className="space-y-1 ml-2">
                                          {order.items.map((item) => (
                                            <div key={item.id} className="text-xs">
                                              <div className="flex justify-between">
                                                <span className="text-muted-foreground">{item.productName} ({item.variantName}):</span>
                                                <span className="font-medium">{item.quantity}</span>
                                              </div>
                                              <div className="flex justify-between text-muted-foreground text-xs ml-2">
                                                <span>@ ₹{Number(item.unitSellingPrice)}/unit</span>
                                                <span>= ₹{Number(item.totalRevenue)}</span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      <Separator className="my-2" />

                                      <div className="flex items-center justify-between">
                                        <div className="space-y-1 w-full">
                                          <div className="flex justify-between gap-6 text-sm">
                                            <span className="text-muted-foreground">Total Amount:</span>
                                            <span className="font-semibold">₹{Number(order.total_amount)}</span>
                                          </div>
                                          <div className="flex justify-between gap-6 text-sm">
                                            <span className="text-muted-foreground">Total Profit:</span>
                                            <span className="font-semibold text-green-600">
                                              +₹{orderProfit.toFixed(0)}
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
