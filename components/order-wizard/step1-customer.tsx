"use client"

import { useState, useEffect, useTransition } from "react"
import { Search, Plus, MapPin, Phone, History, ArrowRight, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { searchCustomers, getCustomerHistory, createCustomer } from "@/app/actions/customers"
import type { SelectedCustomer, OrderItemData } from "./wizard"
import { format } from "date-fns"

import { getOrderTotals } from "@/lib/order-utils"

export function Step1Customer({ onNext }: { onNext: (customer: SelectedCustomer, preloadItems?: OrderItemData[]) => void }) {
  const [query, setQuery] = useState("")
  const [customers, setCustomers] = useState<any[]>([])
  const [isPending, startTransition] = useTransition()
  
  const [selectedCustId, setSelectedCustId] = useState<string | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  
  // New Customer Form
  const [isNew, setIsNew] = useState(false)
  const [newCust, setNewCust] = useState({ shop_name: "", city: "", phone: "", address: "" })
  const [creating, setCreating] = useState(false)

  // Fetch initial customers
  useEffect(() => {
    handleSearch("")
  }, [])

  const handleSearch = (q: string) => {
    setQuery(q)
    startTransition(async () => {
      const results = await searchCustomers(q)
      setCustomers(results)
    })
  }

  const selectCustomer = async (cust: any) => {
    setSelectedCustId(cust.id)
    setIsLoadingHistory(true)
    const hist = await getCustomerHistory(cust.id)
    setHistory(hist)
    setIsLoadingHistory(false)
  }

  const handleCreateCustomer = async () => {
    if (!newCust.shop_name || !newCust.city) return
    setCreating(true)
    try {
      const created = await createCustomer(newCust)
      onNext(created)
    } catch (e: any) {
      alert(e.message || "Failed to create customer")
    } finally {
      setCreating(false)
    }
  }

  const handleFastReorder = (order: any) => {
    const cust = customers.find(c => c.id === selectedCustId)
    if (!cust) return
    
    // Transform order items back to OrderItemData safely
    const orderItems = order.items ?? []
    const mappedItems: OrderItemData[] = orderItems.map((i: any) => {
      const qty = Number(i.quantity || 1)
      const unitSell = Number(i.unitSellingPrice || 0)
      const unitCost = Number(i.unitCostPrice || 0)
      const rev = Number(i.totalRevenue || (qty * unitSell))
      const prof = Number(i.totalProfit || (rev - (qty * unitCost)))

      return {
        id: Math.random().toString(),
        categoryId: "unknown",
        categoryName: i.categoryName || "Khakhra",
        productId: "unknown",
        productName: i.productName || "Product",
        variantId: i.variantId,
        variantName: i.variantName || "1kg",
        quantity: qty,
        unitCostPrice: unitCost,
        unitSellingPrice: unitSell,
        totalRevenue: rev,
        totalProfit: prof
      }
    })

    onNext(cust, mappedItems)
  }

  if (isNew) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between pb-4 border-b">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Add New Customer</h2>
            <p className="text-xs text-muted-foreground">Register customer details to start ordering.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsNew(false)}>Cancel</Button>
        </div>
        <div className="grid gap-4 max-w-lg">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Shop / Business Name *</label>
            <Input value={newCust.shop_name} onChange={e => setNewCust({...newCust, shop_name: e.target.value})} placeholder="e.g. Jalaram Bakery" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">City *</label>
            <Input value={newCust.city} onChange={e => setNewCust({...newCust, city: e.target.value})} placeholder="e.g. Surat" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Phone Number</label>
            <Input value={newCust.phone} onChange={e => setNewCust({...newCust, phone: e.target.value})} placeholder="+91..." />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Delivery Address</label>
            <Input value={newCust.address} onChange={e => setNewCust({...newCust, address: e.target.value})} placeholder="Full address" />
          </div>
          <Button disabled={creating || !newCust.shop_name || !newCust.city} onClick={handleCreateCustomer} className="mt-2">
            {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save & Continue to Products
          </Button>
        </div>
      </div>
    )
  }

  const selectedData = customers.find(c => c.id === selectedCustId)

  return (
    <div className="grid lg:grid-cols-12 gap-6 animate-in fade-in">
      {/* Left Column: Search & List */}
      <div className="lg:col-span-7 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Select Customer</h2>
            <p className="text-xs text-muted-foreground">Search from existing clients or create a new one</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsNew(true)} className="gap-1 text-xs">
            <Plus className="w-3.5 h-3.5" /> Add Customer
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by shop name, city, phone..." 
            className="pl-9 bg-card border-border/70 text-sm"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {isPending && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
        </div>

        <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
          {customers.length === 0 && !isPending && (
            <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl bg-muted/20">
              <Search className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm font-medium">No customers found</p>
              <p className="text-xs text-muted-foreground/80 mt-1">Try a different search term or add a new customer.</p>
            </div>
          )}
          {customers.map(c => {
            const isSelected = selectedCustId === c.id
            const orderCount = c._count?.orders ?? c.totalOrders ?? 0
            return (
              <div 
                key={c.id} 
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-primary/5 border-primary shadow-xs ring-1 ring-primary' 
                    : 'bg-card border-border/70 hover:border-border hover:bg-muted/20'
                }`}
                onClick={() => selectCustomer(c)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-base text-foreground flex items-center gap-2">
                      {c.shop_name}
                      {orderCount > 5 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          VIP
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 font-medium text-foreground/80">
                        <MapPin className="w-3 h-3 text-muted-foreground" /> {c.city}
                      </span>
                      {c.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-muted-foreground" /> {c.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-muted text-muted-foreground border border-border/50">
                      {orderCount} {orderCount === 1 ? 'order' : 'orders'}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Right Column: Details & History */}
      <div className="lg:col-span-5 bg-muted/20 rounded-2xl p-5 border border-border/70 flex flex-col">
        {selectedCustId ? (
          <div className="space-y-5 flex-1 flex flex-col">
            <div className="p-4 rounded-xl bg-card border border-border/60 shadow-xs">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Selected Customer</span>
              <h3 className="text-lg font-bold text-foreground mt-0.5">{selectedData?.shop_name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {selectedData?.city}
                {selectedData?.phone && ` • ${selectedData.phone}`}
              </p>
              {selectedData?.address && (
                <p className="text-xs text-muted-foreground/80 mt-1 border-t pt-1.5 line-clamp-2">
                  {selectedData.address}
                </p>
              )}
            </div>

            <Button className="w-full font-semibold shadow-xs" size="lg" onClick={() => onNext(selectedData!)}>
              Start Blank Order <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <div className="pt-4 border-t flex-1">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" /> Recent Orders ({history.length})
                </h4>
              </div>
              
              {isLoadingHistory ? (
                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : history.length > 0 ? (
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {history.map(order => {
                    const totals = getOrderTotals(order)
                    const itemCount = (order.items ?? []).length

                    return (
                      <div key={order.id} className="bg-card p-3.5 rounded-xl border border-border/60 shadow-xs text-sm hover:border-border transition-colors">
                        <div className="flex justify-between items-center font-bold mb-1">
                          <span className="text-xs text-foreground">
                            {order.created_at ? format(new Date(order.created_at), 'dd MMM yyyy') : 'Past Order'}
                          </span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                            ₹{Math.round(totals.totalRevenue).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mb-2.5 flex justify-between items-center">
                          <span>{itemCount} {itemCount === 1 ? 'item' : 'items'} ({totals.totalKhakhraKg} kg)</span>
                          <span className="capitalize px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground">
                            {order.status || 'completed'}
                          </span>
                        </div>
                        <Button variant="outline" size="sm" className="w-full text-xs h-7 gap-1 font-medium" onClick={() => handleFastReorder(order)}>
                          <RefreshCw className="w-3 h-3" /> Reorder Previous Items
                        </Button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-xs border border-dashed border-border rounded-xl">
                  No previous orders found for this customer.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-muted-foreground text-center p-6 space-y-3">
            <div className="w-12 h-12 bg-muted/60 rounded-2xl flex items-center justify-center border border-border/60">
              <Search className="w-5 h-5 text-muted-foreground/60" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">No Customer Selected</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Select a customer from the left list to see order history, quick re-order, or start a new order.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
