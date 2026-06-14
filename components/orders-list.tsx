"use client"
import { useState } from "react"
import { OrderCard } from "@/components/order-card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Filter, Search, X } from "lucide-react"

export function OrdersList({ initialOrders }: { initialOrders: any[] }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [cityFilter, setCityFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  const cities = Array.from(new Set(initialOrders.map(o => o.city).filter(Boolean))).sort()

  const filteredOrders = initialOrders.filter((order) => {
    const shopName  = (order.customer?.shop_name || order.shop_name || "").toLowerCase()
    const city      = (order.city || "").toLowerCase()
    const matchesSearch = shopName.includes(searchTerm.toLowerCase()) || city.includes(searchTerm.toLowerCase())
    const matchesCity   = cityFilter === "all" || order.city === cityFilter
    const matchesTab    = activeTab  === "all" || order.status === activeTab

    let matchesDate = true
    if (dateFilter && order.created_at) {
      try {
        const orderDate = new Date(order.created_at).toISOString().slice(0, 10)
        matchesDate = orderDate === dateFilter
      } catch (e) {
        matchesDate = false
      }
    }

    return matchesSearch && matchesCity && matchesTab && matchesDate
  })

  const pending   = initialOrders.filter(o => o.status === "pending").length
  const completed = initialOrders.filter(o => o.status === "completed").length

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Orders</h2>
        <p className="text-muted-foreground">
          {initialOrders.length} total orders — {pending} pending, {completed} completed
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by shop name or city…"
            className="pl-8 bg-background border-border"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground hidden sm:block shrink-0" />
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-[180px] bg-background border-border">
              <SelectValue placeholder="Filter by City" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {cities.map((city: any) => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1">
            <Input
              type="date"
              className="w-[160px] bg-background border-border text-foreground scheme-dark"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
            {dateFilter && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDateFilter("")}
                className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-3 mb-6 bg-muted border border-border">
          <TabsTrigger value="all">All ({initialOrders.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pending})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completed})</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="mt-0">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredOrders.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No orders found matching your filters.
              </div>
            ) : (
              filteredOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
