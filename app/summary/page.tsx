"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { calculateOrderProfit, CITIES, type Order, supabase } from "@/lib/supabase"
import { Search, Users, ShoppingCart, TrendingUp, MapPin, Package, IndianRupee, ShoppingBag } from "lucide-react"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface CustomerSummary {
  shopName: string
  city: string
  totalOrders: number
  totalAmount: number
  totalKhakhraProfit: number
  totalPatraProfit: number
  totalKhakhraKg: number
  totalPatraPackets: number
  orders: Order[]
  lastOrderDate: string
}

export default function SummaryPage() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [cityFilter, setCityFilter] = useState("all")
  const [sortBy, setSortBy] = useState("orders")

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          khakhra_items (*)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error("Error fetching orders:", error)
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  // Calculate customer summaries
  const calculateCustomerSummaries = (): CustomerSummary[] => {
    const customerMap = new Map<string, CustomerSummary>()

    orders.forEach((order) => {
      const key = `${order.shop_name}-${order.city}`
      const { khakhraProfit, patraProfit } = calculateOrderProfit(order)

      if (!customerMap.has(key)) {
        customerMap.set(key, {
          shopName: order.shop_name,
          city: order.city,
          totalOrders: 0,
          totalAmount: 0,
          totalKhakhraProfit: 0,
          totalPatraProfit: 0,
          totalKhakhraKg: 0,
          totalPatraPackets: 0,
          orders: [],
          lastOrderDate: order.created_at,
        })
      }

      const customer = customerMap.get(key)!
      customer.totalOrders += 1
      customer.totalAmount += order.total_amount || 0
      customer.totalKhakhraProfit += khakhraProfit
      customer.totalPatraProfit += patraProfit
      customer.totalKhakhraKg += order.total_khakhra_kg || 0
      customer.totalPatraPackets += order.patra_packets || 0
      customer.orders.push(order)

      // Update last order date if this order is more recent
      if (new Date(order.created_at) > new Date(customer.lastOrderDate)) {
        customer.lastOrderDate = order.created_at
      }
    })

    return Array.from(customerMap.values())
  }

  const customerSummaries = calculateCustomerSummaries()

  // Filter and sort customers
  const filteredCustomers = customerSummaries
    .filter((customer) => {
      const matchesSearch =
        customer.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.city.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCity = cityFilter === "all" || customer.city === cityFilter
      return matchesSearch && matchesCity
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "orders":
          return b.totalOrders - a.totalOrders
        case "amount":
          return b.totalAmount - a.totalAmount
        case "profit":
          return b.totalKhakhraProfit + b.totalPatraProfit - (a.totalKhakhraProfit + a.totalPatraProfit)
        case "recent":
          return new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime()
        default:
          return b.totalOrders - a.totalOrders
      }
    })

  // Calculate overall stats
  let overallKhakhraProfit = 0
  let overallPatraProfit = 0
  orders.forEach((order) => {
    const { khakhraProfit, patraProfit } = calculateOrderProfit(order)
    overallKhakhraProfit += khakhraProfit
    overallPatraProfit += patraProfit
  })

  const overallStats = {
    totalCustomers: customerSummaries.length,
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, order) => sum + (order.total_amount || 0), 0),
    totalKhakhraProfit: Math.round(overallKhakhraProfit),
    totalPatraProfit: Math.round(overallPatraProfit),
    totalKhakhraSold: Math.round(orders.reduce((sum, order) => sum + order.total_khakhra_kg, 0) * 10) / 10,
    totalPatraSold: orders.reduce((sum, order) => sum + order.patra_packets, 0),
    avgOrdersPerCustomer:
      customerSummaries.length > 0 ? Math.round((orders.length / customerSummaries.length) * 10) / 10 : 0,
    topCustomer: filteredCustomers[0] || null,
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading summary...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Business Summary</h2>
          <p className="text-muted-foreground text-sm sm:text-base">Complete overview of customers and their orders</p>
        </div>

        {/* Overall Stats */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Customers
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{overallStats.totalCustomers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Total Orders
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{overallStats.totalOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <IndianRupee className="h-4 w-4" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">₹{overallStats.totalRevenue.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Avg Orders/Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{overallStats.avgOrdersPerCustomer}</div>
            </CardContent>
          </Card>
        </div>

        {/* Overall Profit & Sales Card */}
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300 text-base sm:text-lg">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
              Overall Profit & Sales
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
              ₹{(overallStats.totalKhakhraProfit + overallStats.totalPatraProfit).toLocaleString()} Total Profit
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-green-700 dark:text-green-300">Khakhra Profit</p>
                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                  ₹{overallStats.totalKhakhraProfit.toLocaleString()}
                </div>
                <p className="text-xs text-green-600/70 dark:text-green-400/70">
                  <Package className="inline-block h-3 w-3 mr-1" />
                  {overallStats.totalKhakhraSold} kg sold
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-green-700 dark:text-green-300">Patra Profit</p>
                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                  ₹{overallStats.totalPatraProfit.toLocaleString()}
                </div>
                <p className="text-xs text-green-600/70 dark:text-green-400/70">
                  <ShoppingBag className="inline-block h-3 w-3 mr-1" />
                  {overallStats.totalPatraSold} packets sold
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Customer Highlight */}
        {overallStats.topCustomer && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Users className="h-5 w-5" />
                Top Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold text-lg">{overallStats.topCustomer.shopName}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {overallStats.topCustomer.city}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Orders</p>
                    <p className="font-semibold">{overallStats.topCustomer.totalOrders}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Revenue</p>
                    <p className="font-semibold">₹{overallStats.topCustomer.totalAmount.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers by shop name or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by city" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {CITIES.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="orders">Most Orders</SelectItem>
              <SelectItem value="amount">Highest Revenue</SelectItem>
              <SelectItem value="profit">Most Profitable</SelectItem>
              <SelectItem value="recent">Most Recent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Customer List */}
        <div className="space-y-4">
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map((customer, index) => (
              <Card key={`${customer.shopName}-${customer.city}`} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span className="truncate">{customer.shopName}</span>
                        {index === 0 && sortBy === "orders" && (
                          <Badge variant="secondary" className="bg-gold-100 text-gold-800">
                            Top Customer
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {customer.city}
                      </CardDescription>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-medium">{customer.totalOrders} Orders</div>
                      <div className="text-xs text-muted-foreground">Last: {formatDate(customer.lastOrderDate)}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <IndianRupee className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-muted-foreground">Revenue</p>
                        <p className="font-semibold">₹{customer.totalAmount.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-muted-foreground">Khakhra Profit</p>
                        <p className="font-semibold">₹{Math.round(customer.totalKhakhraProfit).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                      <div>
                        <p className="text-muted-foreground">Patra Profit</p>
                        <p className="font-semibold">₹{Math.round(customer.totalPatraProfit).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="text-muted-foreground">Khakhra Sold</p>
                        <p className="font-semibold">{customer.totalKhakhraKg} kg</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-red-600" />
                      <div>
                        <p className="text-muted-foreground">Patra Sold</p>
                        <p className="font-semibold">{customer.totalPatraPackets} packets</p>
                      </div>
                    </div>
                  </div>

                  {/* Order Details */}
                  <Tabs defaultValue="recent" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="recent">Recent Orders</TabsTrigger>
                      <TabsTrigger value="products">Products Ordered</TabsTrigger>
                    </TabsList>

                    <TabsContent value="recent" className="mt-4">
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {customer.orders.slice(0, 5).map((order) => (
                          <div key={order.id} className="flex items-center justify-between p-2 border rounded text-sm">
                            <div>
                              <span className="font-medium">₹{order.total_amount}</span>
                              <span className="text-muted-foreground ml-2">{formatDate(order.created_at)}</span>
                            </div>
                            <Badge variant={order.status === "completed" ? "default" : "secondary"}>
                              {order.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="products" className="mt-4">
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {/* Khakhra Items */}
                        {customer.orders
                          .flatMap((order) => order.khakhra_items || [])
                          .reduce((acc, item) => {
                            const existing = acc.find((i) => i.khakhra_type === item.khakhra_type)
                            if (existing) {
                              existing.quantity_kg += item.quantity_kg
                            } else {
                              acc.push({ ...item })
                            }
                            return acc
                          }, [] as any[])
                          .map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 border rounded text-sm">
                              <span>{item.khakhra_type}</span>
                              <Badge variant="outline">{item.quantity_kg} kg</Badge>
                            </div>
                          ))}

                        {/* Patra */}
                        {customer.totalPatraPackets > 0 && (
                          <div className="flex items-center justify-between p-2 border rounded text-sm">
                            <span>Patra</span>
                            <Badge variant="outline">{customer.totalPatraPackets} packets</Badge>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No customers found</h3>
              <p className="text-muted-foreground">
                {searchTerm || cityFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "No orders have been created yet"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
