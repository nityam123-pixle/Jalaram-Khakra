"use client"

import { EditOrderDialog } from "@/components/edit-order-dialog"
import { NewOrderDialog } from "@/components/new-order-dialog"
import { OrderCard } from "@/components/order-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CITIES, type Order, supabase } from "@/lib/supabase"
import { Filter, Plus, Search } from "lucide-react"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"

export default function OrdersPage() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [cityFilter, setCityFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("all")
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

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

  const handleStatusChange = async (orderId: string, status: Order["status"]) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", orderId)

      if (error) throw error

      setOrders(orders.map((order) => (order.id === orderId ? { ...order, status } : order)))
      toast({
        title: "Success",
        description: "Order status updated successfully",
      })
    } catch (error) {
      console.error("Error updating order status:", error)
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (order: Order) => {
    setEditingOrder(order)
    setEditDialogOpen(true)
  }

  const handleDelete = async (orderId: string) => {
    if (!confirm("Are you sure you want to delete this order?")) return

    try {
      const { error } = await supabase.from("orders").delete().eq("id", orderId)

      if (error) throw error

      setOrders(orders.filter((order) => order.id !== orderId))
      toast({
        title: "Success",
        description: "Order deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting order:", error)
      toast({
        title: "Error",
        description: "Failed to delete order",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  // Filter orders based on search term, city filter, and active tab
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.shop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.city.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCity = cityFilter === "all" || order.city === cityFilter
    const matchesTab = activeTab === "all" || order.status === activeTab

    return matchesSearch && matchesCity && matchesTab
  })

  const getOrderCounts = () => {
    return {
      all: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      completed: orders.filter((o) => o.status === "completed").length,
    }
  }

  const counts = getOrderCounts()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
            <p className="text-muted-foreground">Manage all your Khakhra and Patra orders</p>
          </div>
          <NewOrderDialog
            trigger={
              <Button size="lg" className="gap-2">
                <Plus className="h-4 w-4" />
                New Order
              </Button>
            }
            onOrderCreated={fetchOrders}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders by shop name or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
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
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({counts.pending})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({counts.completed})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredOrders.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onStatusChange={handleStatusChange}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 text-muted-foreground">
                  <Search className="h-full w-full" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">No orders found</h3>
                <p className="mt-2 text-muted-foreground">
                  {searchTerm || cityFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "Get started by creating your first order"}
                </p>
                {!searchTerm && cityFilter === "all" && (
                  <NewOrderDialog
                    trigger={
                      <Button className="mt-4">
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Order
                      </Button>
                    }
                    onOrderCreated={fetchOrders}
                  />
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Order Dialog */}
        <EditOrderDialog
          order={editingOrder}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onOrderUpdated={fetchOrders}
        />
      </div>
    </div>
  )
}
