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
    
    // Transform order items back to OrderItemData
    const mappedItems: OrderItemData[] = order.items.map((i: any) => ({
      id: Math.random().toString(),
      categoryId: "unknown", // we don't have this in history item
      categoryName: i.categoryName,
      productId: "unknown",
      productName: i.productName,
      variantId: i.variantId,
      variantName: i.variantName,
      quantity: i.quantity,
      unitCostPrice: Number(i.unitCostPrice),
      unitSellingPrice: Number(i.unitSellingPrice),
      totalRevenue: Number(i.totalRevenue),
      totalProfit: Number(i.totalProfit)
    }))

    onNext(cust, mappedItems)
  }

  if (isNew) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">New Customer</h2>
          <Button variant="ghost" onClick={() => setIsNew(false)}>Cancel</Button>
        </div>
        <div className="grid gap-4 max-w-md">
          <div className="space-y-2">
            <label className="text-sm font-medium">Shop Name *</label>
            <Input value={newCust.shop_name} onChange={e => setNewCust({...newCust, shop_name: e.target.value})} placeholder="e.g. Jalaram Bakery" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">City *</label>
            <Input value={newCust.city} onChange={e => setNewCust({...newCust, city: e.target.value})} placeholder="e.g. Surat" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Phone (Optional)</label>
            <Input value={newCust.phone} onChange={e => setNewCust({...newCust, phone: e.target.value})} placeholder="+91..." />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Address (Optional)</label>
            <Input value={newCust.address} onChange={e => setNewCust({...newCust, address: e.target.value})} placeholder="Full address" />
          </div>
          <Button disabled={creating || !newCust.shop_name || !newCust.city} onClick={handleCreateCustomer} className="mt-4">
            {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Create & Continue
          </Button>
        </div>
      </div>
    )
  }

  const selectedData = customers.find(c => c.id === selectedCustId)

  return (
    <div className="grid md:grid-cols-2 gap-8 animate-in fade-in">
      {/* Left Column: Search & List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Select Customer</h2>
          <Button variant="outline" size="sm" onClick={() => setIsNew(true)}>
            <Plus className="w-4 h-4 mr-1" /> New
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name, city, phone..." 
            className="pl-9"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {isPending && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
        </div>

        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {customers.length === 0 && !isPending && (
            <div className="text-center py-8 text-muted-foreground border border-border rounded-lg bg-muted/30">
              No customers found.
            </div>
          )}
          {customers.map(c => (
            <Card 
              key={c.id} 
              className={`cursor-pointer transition-colors hover:border-primary/50 ${selectedCustId === c.id ? 'border-primary ring-1 ring-primary' : ''}`}
              onClick={() => selectCustomer(c)}
            >
              <CardContent className="p-4">
                <div className="font-semibold text-lg">{c.shop_name}</div>
                <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {c.city}</span>
                  {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {c.phone}</span>}
                </div>
                <div className="flex gap-2 mt-3 text-xs">
                  <Badge variant="secondary">{c._count?.orders ?? c.totalOrders} Orders</Badge>
                  {c.lastOrderAt && <Badge variant="outline">Last: {format(new Date(c.lastOrderAt), 'dd MMM yyyy')}</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Right Column: Details & History */}
      <div className="bg-muted/30 rounded-xl p-6 border border-border">
        {selectedCustId ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold">{selectedData?.shop_name}</h3>
              <p className="text-muted-foreground">{selectedData?.city}</p>
            </div>

            <Button className="w-full" size="lg" onClick={() => onNext(selectedData!)}>
              Start New Blank Order <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <div className="pt-6 border-t">
              <h4 className="font-medium flex items-center gap-2 mb-4">
                <History className="w-4 h-4" /> Recent Order History
              </h4>
              
              {isLoadingHistory ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : history.length > 0 ? (
                <div className="space-y-3">
                  {history.map(order => (
                    <div key={order.id} className="bg-card p-4 rounded-lg border border-border shadow-sm text-sm">
                      <div className="flex justify-between font-medium mb-1">
                        <span>{format(new Date(order.created_at), 'dd MMM yyyy')}</span>
                        <span>₹{(order.items ?? []).reduce((s: number, i: any) => s + Number(i.totalRevenue), 0).toFixed(0)}</span>
                      </div>
                      <div className="text-muted-foreground mb-3 flex justify-between">
                        <span>{order.items.length} items</span>
                        <Badge variant="secondary" className="capitalize">{order.status}</Badge>
                      </div>
                      <Button variant="outline" className="w-full text-xs h-8" onClick={() => handleFastReorder(order)}>
                        <RefreshCw className="w-3 h-3 mr-2" /> Use Previous Order
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No previous orders found.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center border border-border">
              <Search className="w-6 h-6" />
            </div>
            <p>Select a customer to view history and start order</p>
          </div>
        )}
      </div>
    </div>
  )
}
