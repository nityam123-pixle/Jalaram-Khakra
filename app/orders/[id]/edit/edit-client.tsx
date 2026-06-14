"use client"
import { useState } from "react"
import { ChevronLeft, Check, Clock, Trash2, Plus, Save, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { updateOrderStatus, updateOrderItems } from "@/app/actions/order"
import { useRouter } from "next/navigation"

const STATUSES = [
  { id: "pending", label: "Pending", icon: Clock },
  { id: "completed", label: "Completed", icon: Check },
]

export function EditOrderClient({ order, catalog }: { order: any, catalog: any[] }) {
  const router = useRouter()
  const [status, setStatus] = useState(order.status?.toLowerCase() || "pending")
  const [savingStatus, setSavingStatus] = useState(false)
  
  // Track order items in state for interactive editing
  const [items, setItems] = useState<any[]>(
    (order.items ?? []).map((item: any) => ({
      id: item.id,
      variantId: item.variantId,
      productName: item.productName,
      variantName: item.variantName,
      unitCostPrice: Number(item.unitCostPrice),
      quantity: Number(item.quantity),
      unitSellingPrice: Number(item.unitSellingPrice),
      totalRevenue: Number(item.totalRevenue),
      totalProfit: Number(item.totalProfit),
    }))
  )
  const [savingItems, setSavingItems] = useState(false)

  // Selector state for adding a new item
  const [newVariantId, setNewVariantId] = useState("")
  const [newQty, setNewQty] = useState<number>(1)
  const [newPrice, setNewPrice] = useState<number>(0)

  // Lookup active pricing rule for any variant
  const getVariantRules = (variantId: string) => {
    for (const cat of catalog) {
      for (const prod of cat.products) {
        const v = prod.variants.find((v: any) => v.id === variantId)
        if (v) return v.pricingRules?.[0]
      }
    }
    return null
  }

  // Lookup variant details
  const getVariantDetails = (variantId: string) => {
    for (const cat of catalog) {
      for (const prod of cat.products) {
        const v = prod.variants.find((v: any) => v.id === variantId)
        if (v) {
          return {
            productName: prod.name,
            variantName: v.name,
            unitType: v.unitType,
            costPrice: v.pricingRules?.[0]?.costPrice ?? 0,
          }
        }
      }
    }
    return null
  }

  const handleStatusChange = async (newStatus: string) => {
    setSavingStatus(true)
    try {
      await updateOrderStatus(order.id, newStatus)
      setStatus(newStatus)
      router.refresh()
    } catch (e) {
      alert("Failed to update status")
    } finally {
      setSavingStatus(false)
    }
  }

  // Update item field (quantity or selling price)
  const handleItemChange = (index: number, field: "quantity" | "unitSellingPrice", value: number) => {
    const updated = [...items]
    const item = { ...updated[index] }
    item[field] = value
    
    // Recalculate totals
    const cost = item.unitCostPrice
    item.totalRevenue = item.quantity * item.unitSellingPrice
    item.totalProfit = item.totalRevenue - (cost * item.quantity)
    
    updated[index] = item
    setItems(updated)
  }

  // Delete an item
  const handleDeleteItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index)
    setItems(updated)
  }

  // When new variant selection changes
  const handleVariantSelect = (vId: string) => {
    setNewVariantId(vId)
    if (!vId) {
      setNewPrice(0)
      return
    }
    const rule = getVariantRules(vId)
    if (rule) {
      setNewPrice(Number(rule.minSellingPrice || rule.costPrice || 0))
    } else {
      setNewPrice(0)
    }
    setNewQty(1)
  }

  // Add item to local state
  const handleAddItem = () => {
    if (!newVariantId) return
    const details = getVariantDetails(newVariantId)
    if (!details) return

    const rule = getVariantRules(newVariantId)
    if (rule) {
      if (rule.minSellingPrice && newPrice < Number(rule.minSellingPrice)) {
        alert(`Price is below minimum allowed (₹${rule.minSellingPrice})`)
        return
      }
      if (rule.maxSellingPrice && newPrice > Number(rule.maxSellingPrice)) {
        alert(`Price is above maximum allowed (₹${rule.maxSellingPrice})`)
        return
      }
    }

    // Check if variant already exists in items
    const existingIndex = items.findIndex(i => i.variantId === newVariantId)
    if (existingIndex > -1) {
      const updated = [...items]
      const item = { ...updated[existingIndex] }
      item.quantity += newQty
      item.totalRevenue = item.quantity * item.unitSellingPrice
      item.totalProfit = item.totalRevenue - (item.unitCostPrice * item.quantity)
      updated[existingIndex] = item
      setItems(updated)
    } else {
      const totalRevenue = newQty * newPrice
      const totalProfit = totalRevenue - (details.costPrice * newQty)
      
      setItems([
        ...items,
        {
          id: Math.random().toString(),
          variantId: newVariantId,
          productName: details.productName,
          variantName: details.variantName,
          unitCostPrice: details.costPrice,
          quantity: newQty,
          unitSellingPrice: newPrice,
          totalRevenue,
          totalProfit,
        }
      ])
    }

    // Reset add state
    setNewVariantId("")
    setNewQty(1)
    setNewPrice(0)
  }

  // Save changes to database
  const handleSaveItems = async () => {
    if (items.length === 0) {
      alert("Order must have at least one item.")
      return
    }

    // Range checks
    for (const item of items) {
      const rule = getVariantRules(item.variantId)
      if (rule) {
        if (rule.minSellingPrice && Number(item.unitSellingPrice) < Number(rule.minSellingPrice)) {
          alert(`Price for ${item.productName} (${item.variantName}) is below minimum (₹${rule.minSellingPrice})`)
          return
        }
        if (rule.maxSellingPrice && Number(item.unitSellingPrice) > Number(rule.maxSellingPrice)) {
          alert(`Price for ${item.productName} (${item.variantName}) is above maximum (₹${rule.maxSellingPrice})`)
          return
        }
      }
    }

    setSavingItems(true)
    try {
      const payload = items.map(i => ({
        variantId: i.variantId,
        quantity: Number(i.quantity),
        sellingPrice: Number(i.unitSellingPrice)
      }))
      await updateOrderItems(order.id, payload)
      alert("Order items updated successfully!")
      router.refresh()
    } catch (e: any) {
      alert(e.message || "Failed to update order items")
    } finally {
      setSavingItems(false)
    }
  }

  const totalRevenue = items.reduce((sum, i) => sum + Number(i.totalRevenue), 0)
  const totalProfit  = items.reduce((sum, i) => sum + Number(i.totalProfit),  0)
  const selectedRule = newVariantId ? getVariantRules(newVariantId) : null

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-8 animate-in fade-in">
      {/* Breadcrumb */}
      <div className="text-sm text-muted-foreground">
        <a href={`/orders/${order.id}`} className="hover:underline flex items-center gap-1 w-fit">
          <ChevronLeft className="w-4 h-4" /> Back to Order Details
        </a>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            Order #{order.id.slice(0, 8).toUpperCase()}
            <Badge variant="outline" className="capitalize">{status}</Badge>
          </h1>
          <p className="text-muted-foreground mt-1">
            Customer: {order.customer?.shop_name || order.shop_name} • {order.city}
          </p>
          <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
            <span>Created: {order.created_at ? format(new Date(order.created_at), 'dd MMM yyyy, p') : 'Unknown'}</span>
            <span>Updated: {order.updated_at ? format(new Date(order.updated_at), 'dd MMM yyyy, p') : 'Unknown'}</span>
          </div>
        </div>
      </div>

      {/* Status Selector */}
      <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
        <h3 className="font-semibold mb-6 text-foreground">Order Status</h3>
        <div className="flex items-center gap-8">
          {STATUSES.map((s) => {
            const Icon = s.icon
            const isActive = status === s.id
            return (
              <button
                key={s.id}
                onClick={() => handleStatusChange(s.id)}
                disabled={savingStatus}
                className="flex flex-col items-center gap-2 group outline-none"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110'
                    : 'bg-muted text-muted-foreground hover:bg-secondary group-hover:scale-105'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-sm font-medium transition-colors ${
                  isActive ? 'text-primary font-bold' : 'text-muted-foreground'
                }`}>
                  {s.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Items Section */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/40 flex justify-between items-center">
          <h3 className="font-semibold text-foreground">Order Items ({items.length})</h3>
        </div>

        <div className="divide-y divide-border">
          {items.map((item, idx) => {
            const rule = getVariantRules(item.variantId)
            const isPriceInvalid = rule && (
              (rule.minSellingPrice && Number(item.unitSellingPrice) < Number(rule.minSellingPrice)) ||
              (rule.maxSellingPrice && Number(item.unitSellingPrice) > Number(rule.maxSellingPrice))
            )

            return (
              <div key={item.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
                <div className="flex-1">
                  <div className="font-medium text-base text-foreground">{item.productName}</div>
                  <div className="text-muted-foreground text-xs">{item.variantName} • Cost: ₹{item.unitCostPrice.toFixed(2)}</div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="w-24">
                    <Label className="text-[10px] text-muted-foreground uppercase">Qty</Label>
                    <Input
                      type="number"
                      min="0.1"
                      step="any"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, "quantity", Number(e.target.value) || 0)}
                      className="h-8 bg-background border-border text-foreground"
                    />
                  </div>

                  <div className="w-28">
                    <Label className="text-[10px] text-muted-foreground uppercase">Selling Price (₹)</Label>
                    <Input
                      type="number"
                      min="1"
                      step="any"
                      value={item.unitSellingPrice}
                      onChange={(e) => handleItemChange(idx, "unitSellingPrice", Number(e.target.value) || 0)}
                      className={`h-8 bg-background border-border text-foreground ${isPriceInvalid ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    />
                  </div>

                  <div className="text-right w-24">
                    <div className="text-sm font-semibold text-foreground">₹{item.totalRevenue.toFixed(2)}</div>
                    <div className="text-xs text-emerald-600 font-medium">Profit: ₹{item.totalProfit.toFixed(2)}</div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteItem(idx)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {isPriceInvalid && rule && (
                  <div className="w-full text-xs text-destructive flex items-center gap-1 mt-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Price range error: must be between ₹{rule.minSellingPrice} and ₹{rule.maxSellingPrice}
                  </div>
                )}
              </div>
            )
          })}
          {items.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">No items in this order.</div>
          )}
        </div>

        {/* Add More Items Form Section */}
        <div className="p-6 bg-muted/20 border-t border-border space-y-4">
          <h4 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Add More Items
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2 space-y-1.5">
              <Label>Product Variant</Label>
              <select
                className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                value={newVariantId}
                onChange={(e) => handleVariantSelect(e.target.value)}
              >
                <option value="">Select product variant...</option>
                {catalog.map(cat => (
                  <optgroup key={cat.id} label={cat.name}>
                    {cat.products.map((prod: any) =>
                      prod.variants.map((v: any) => (
                        <option key={v.id} value={v.id}>
                          {prod.name} — {v.name} ({v.unitType})
                        </option>
                      ))
                    )}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Quantity</Label>
              <Input
                type="number"
                min="0.1"
                step="any"
                disabled={!newVariantId}
                value={newQty}
                onChange={(e) => setNewQty(Number(e.target.value) || 1)}
                className="bg-background border-border text-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Selling Price (₹)</Label>
              <Input
                type="number"
                min="1"
                step="any"
                disabled={!newVariantId}
                value={newPrice}
                onChange={(e) => setNewPrice(Number(e.target.value) || 0)}
                className="bg-background border-border text-foreground"
              />
            </div>
          </div>

          {selectedRule && (
            <div className="text-xs text-muted-foreground flex gap-4">
              <span>Cost Price: ₹{Number(selectedRule.costPrice).toFixed(2)}</span>
              {selectedRule.minSellingPrice && <span>Min Sell: ₹{Number(selectedRule.minSellingPrice).toFixed(2)}</span>}
              {selectedRule.maxSellingPrice && <span>Max Sell: ₹{Number(selectedRule.maxSellingPrice).toFixed(2)}</span>}
            </div>
          )}

          <Button
            type="button"
            disabled={!newVariantId}
            onClick={handleAddItem}
            className="w-full sm:w-auto"
          >
            Add Item to Order
          </Button>
        </div>

        {/* Totals & Save Changes */}
        <div className="p-6 bg-muted/40 border-t border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1 text-sm">
            <div className="flex gap-4">
              <span className="text-muted-foreground w-28">Total Revenue:</span>
              <span className="font-bold text-foreground order-amount">₹{totalRevenue.toFixed(2)}</span>
            </div>
            <div className="flex gap-4">
              <span className="text-muted-foreground w-28">Total Profit:</span>
              <span className="font-bold text-emerald-600 profit-value">₹{totalProfit.toFixed(2)}</span>
            </div>
          </div>

          <Button
            onClick={handleSaveItems}
            disabled={savingItems || items.length === 0}
            className="w-full sm:w-auto gap-2"
          >
            {savingItems ? "Saving Changes..." : (
              <>
                <Save className="w-4 h-4" /> Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
