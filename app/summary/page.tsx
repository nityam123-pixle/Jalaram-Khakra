"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { calculateOrderProfit, CITIES, type Order, supabase } from "@/lib/supabase"
import {
  Search,
  Users,
  ShoppingCart,
  TrendingUp,
  MapPin,
  Package,
  IndianRupee,
  ShoppingBag,
  Calendar,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface CustomerSummary {
  shopName: string
  city: string
  totalOrders: number
  totalAmount: number
  totalKhakhraProfit: number
  totalPatraProfit: number
  totalFulvadiProfit: number
  totalKhakhraKg: number
  totalPatraPackets: number
  totalFulvadiPackets: number
  orders: Order[]
  lastOrderDate: string
}

interface MonthlySummary {
  month: string
  year: number
  totalOrders: number
  totalRevenue: number
  totalProfit: number
  totalKhakhraSold: number
  totalPatraSold: number
  totalBhakarwadiSold: number
  totalFulvadiSold: number
  khakhraRevenue: number
  patraRevenue: number
  fulvadiRevenue: number
  khakhraProfit: number
  patraProfit: number
  fulvadiProfit: number
  bhakarwadiRevenue: number
  bhakarwadiProfit: number
}

export default function SummaryPage() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [cityFilter, setCityFilter] = useState("all")
  const [sortBy, setSortBy] = useState("orders")
  const [activeTab, setActiveTab] = useState("customers")

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
      const { khakhraProfit, patraProfit, fulvadiProfit } = calculateOrderProfit(order)

      if (!customerMap.has(key)) {
        customerMap.set(key, {
          shopName: order.shop_name,
          city: order.city,
          totalOrders: 0,
          totalAmount: 0,
          totalKhakhraProfit: 0,
          totalPatraProfit: 0,
          totalFulvadiProfit: 0,
          totalKhakhraKg: 0,
          totalPatraPackets: 0,
          totalFulvadiPackets: 0,
          orders: [],
          lastOrderDate: order.created_at,
        })
      }

      const customer = customerMap.get(key)!
      customer.totalOrders += 1
      customer.totalAmount += order.total_amount || 0
      customer.totalKhakhraProfit += khakhraProfit
      customer.totalPatraProfit += patraProfit
      customer.totalFulvadiProfit += fulvadiProfit
      customer.totalKhakhraKg += order.total_khakhra_kg || 0
      customer.totalPatraPackets += order.patra_packets || 0
      customer.totalFulvadiPackets += order.fulvadi_packets || 0
      customer.orders.push(order)

      // Update last order date if this order is more recent
      if (new Date(order.created_at) > new Date(customer.lastOrderDate)) {
        customer.lastOrderDate = order.created_at
      }
    })

    return Array.from(customerMap.values())
  }

  // Calculate monthly summaries - only for months with actual sales
  const calculateMonthlySummaries = (): MonthlySummary[] => {
    const monthlyMap = new Map<string, MonthlySummary>()

    orders.forEach((order) => {
      const date = new Date(order.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      const monthName = date.toLocaleDateString("en-US", { month: "long" })
      const year = date.getFullYear()

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: monthName,
          year,
          totalOrders: 0,
          totalRevenue: 0,
          totalProfit: 0,
          totalKhakhraSold: 0,
          totalPatraSold: 0,
          totalBhakarwadiSold: 0,
          totalFulvadiSold: 0,
          khakhraRevenue: 0,
          patraRevenue: 0,
          fulvadiRevenue: 0,
          khakhraProfit: 0,
          patraProfit: 0,
          fulvadiProfit: 0,
          bhakarwadiRevenue: 0,
          bhakarwadiProfit: 0,
        })
      }

      const monthly = monthlyMap.get(monthKey)!
      const { khakhraProfit, patraProfit, fulvadiProfit } = calculateOrderProfit(order)

      monthly.totalOrders += 1
      monthly.totalRevenue += order.total_amount || 0
      monthly.totalProfit += khakhraProfit + patraProfit + fulvadiProfit
      monthly.totalKhakhraSold += order.total_khakhra_kg || 0
      monthly.totalPatraSold += order.patra_packets || 0
      monthly.totalFulvadiSold += order.fulvadi_packets || 0

      // Calculate revenue breakdown
      let khakhraRevenue = 0
      let bhakarwadiRevenue = 0
      let bhakarwadiKg = 0

      if (order.khakhra_items) {
        order.khakhra_items.forEach((item) => {
          if (item.khakhra_type.toLowerCase().includes("bhakarwadi")) {
            if (item.is_packet_item) {
              bhakarwadiRevenue += (item.packet_quantity || 0) * (item.price_per_packet || 0)
              bhakarwadiKg += (item.packet_quantity || 0) * 0.2
            } else {
              bhakarwadiRevenue += item.quantity_kg * item.price_per_kg
              bhakarwadiKg += item.quantity_kg
            }
          } else if (!item.khakhra_type.toLowerCase().includes("fulvadi")) {
            if (item.is_packet_item) {
              khakhraRevenue += (item.packet_quantity || 0) * (item.price_per_packet || 0)
            } else {
              khakhraRevenue += item.quantity_kg * item.price_per_kg
            }
          }
        })
      }

      monthly.totalBhakarwadiSold += bhakarwadiKg
      monthly.khakhraRevenue += khakhraRevenue
      monthly.bhakarwadiRevenue += bhakarwadiRevenue
      monthly.patraRevenue += order.wants_patra ? order.patra_packets * order.patra_price_per_packet : 0
      monthly.fulvadiRevenue += order.wants_fulvadi ? order.fulvadi_packets * order.fulvadi_price_per_packet : 0

      // Calculate profit breakdown
      monthly.khakhraProfit += khakhraProfit
      monthly.patraProfit += patraProfit
      monthly.fulvadiProfit += fulvadiProfit

      // Calculate Bhakarwadi profit separately
      if (order.khakhra_items) {
        order.khakhra_items.forEach((item) => {
          if (item.khakhra_type.toLowerCase().includes("bhakarwadi")) {
            if (item.is_packet_item) {
              monthly.bhakarwadiProfit += (item.packet_quantity || 0) * 33 // Fixed profit per packet
            } else {
              monthly.bhakarwadiProfit += item.quantity_kg * 25 // Base profit per kg
            }
          }
        })
      }
    })

    return Array.from(monthlyMap.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year
      return b.month.localeCompare(a.month)
    })
  }

  const customerSummaries = calculateCustomerSummaries()
  const monthlySummaries = calculateMonthlySummaries()

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
          return (
            b.totalKhakhraProfit +
            b.totalPatraProfit +
            b.totalFulvadiProfit -
            (a.totalKhakhraProfit + a.totalPatraProfit + a.totalFulvadiProfit)
          )
        case "recent":
          return new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime()
        default:
          return b.totalOrders - a.totalOrders
      }
    })

  // Calculate overall stats
  let overallKhakhraProfit = 0
  let overallPatraProfit = 0
  let overallFulvadiProfit = 0
  orders.forEach((order) => {
    const { khakhraProfit, patraProfit, fulvadiProfit } = calculateOrderProfit(order)
    overallKhakhraProfit += khakhraProfit
    overallPatraProfit += patraProfit
    overallFulvadiProfit += fulvadiProfit
  })

  const overallStats = {
    totalCustomers: customerSummaries.length,
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, order) => sum + (order.total_amount || 0), 0),
    totalKhakhraProfit: Math.round(overallKhakhraProfit),
    totalPatraProfit: Math.round(overallPatraProfit),
    totalFulvadiProfit: Math.round(overallFulvadiProfit),
    totalKhakhraSold: Math.round(orders.reduce((sum, order) => sum + order.total_khakhra_kg, 0) * 10) / 10,
    totalPatraSold: orders.reduce((sum, order) => sum + order.patra_packets, 0),
    totalFulvadiSold: orders.reduce((sum, order) => sum + order.fulvadi_packets, 0),
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
          <p className="text-muted-foreground text-sm sm:text-base">
            Complete overview of customers and monthly performance
          </p>
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
                Total Profit
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">
                ₹
                {(
                  overallStats.totalKhakhraProfit +
                  overallStats.totalPatraProfit +
                  overallStats.totalFulvadiProfit
                ).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Customer and Monthly Views */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="customers">Customer Summary</TabsTrigger>
            <TabsTrigger value="monthly">Monthly Summary</TabsTrigger>
          </TabsList>

          {/* Customer Summary Tab */}
          <TabsContent value="customers" className="space-y-6">
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
                          <div className="text-xs text-muted-foreground">
                            Last: {formatDate(customer.lastOrderDate)}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Summary Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
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
                          <TrendingUp className="h-4 w-4 text-red-600" />
                          <div>
                            <p className="text-muted-foreground">Fulvadi Profit</p>
                            <p className="font-semibold">₹{Math.round(customer.totalFulvadiProfit).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-orange-600" />
                          <div>
                            <p className="text-muted-foreground">Khakhra Sold</p>
                            <p className="font-semibold">{customer.totalKhakhraKg} kg</p>
                          </div>
                        </div>
                      </div>
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
          </TabsContent>

          {/* Monthly Summary Tab */}
          <TabsContent value="monthly" className="space-y-6">
            <div className="space-y-4">
              {monthlySummaries.length > 0 ? (
                monthlySummaries.map((monthly, index) => (
                  <Card key={`${monthly.year}-${monthly.month}`} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            <span>
                              {monthly.month} {monthly.year}
                            </span>
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {monthly.totalOrders} orders • ₹{monthly.totalRevenue.toLocaleString()} revenue
                          </CardDescription>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-lg font-bold text-green-600">
                            ₹{Math.round(monthly.totalProfit).toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">Total Profit</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Revenue Breakdown */}
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <IndianRupee className="h-4 w-4" />
                          Revenue Breakdown
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-blue-600" />
                            <div>
                              <p className="text-muted-foreground">Khakhra</p>
                              <p className="font-semibold">₹{monthly.khakhraRevenue.toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4 text-purple-600" />
                            <div>
                              <p className="text-muted-foreground">Patra</p>
                              <p className="font-semibold">₹{monthly.patraRevenue.toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4 text-amber-600" />
                            <div>
                              <p className="text-muted-foreground">Bhakarwadi</p>
                              <p className="font-semibold">₹{monthly.bhakarwadiRevenue.toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4 text-red-600" />
                            <div>
                              <p className="text-muted-foreground">Fulvadi</p>
                              <p className="font-semibold">₹{monthly.fulvadiRevenue.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Profit Breakdown */}
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Profit Breakdown
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-blue-600" />
                            <div>
                              <p className="text-muted-foreground">Khakhra</p>
                              <p className="font-semibold text-green-600">
                                ₹{Math.round(monthly.khakhraProfit).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4 text-purple-600" />
                            <div>
                              <p className="text-muted-foreground">Patra</p>
                              <p className="font-semibold text-green-600">
                                ₹{Math.round(monthly.patraProfit).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4 text-amber-600" />
                            <div>
                              <p className="text-muted-foreground">Bhakarwadi</p>
                              <p className="font-semibold text-green-600">
                                ₹{Math.round(monthly.bhakarwadiProfit).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4 text-red-600" />
                            <div>
                              <p className="text-muted-foreground">Fulvadi</p>
                              <p className="font-semibold text-green-600">
                                ₹{Math.round(monthly.fulvadiProfit).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Quantity Sold */}
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <ShoppingCart className="h-4 w-4" />
                          Quantity Sold
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-green-600" />
                            <div>
                              <p className="text-muted-foreground">Khakhra</p>
                              <p className="font-semibold">{Math.round(monthly.totalKhakhraSold * 10) / 10} kg</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4 text-purple-600" />
                            <div>
                              <p className="text-muted-foreground">Patra</p>
                              <p className="font-semibold">{monthly.totalPatraSold} packets</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4 text-amber-600" />
                            <div>
                              <p className="text-muted-foreground">Bhakarwadi</p>
                              <p className="font-semibold">{Math.round(monthly.totalBhakarwadiSold * 10) / 10} kg</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4 text-red-600" />
                            <div>
                              <p className="text-muted-foreground">Fulvadi</p>
                              <p className="font-semibold">{monthly.totalFulvadiSold} packets</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No monthly data available</h3>
                  <p className="text-muted-foreground">Create some orders to see monthly summaries</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
