"use client"

import { useState } from "react"
import { ChevronLeft, ShoppingCart, Edit2, Trash2, Copy, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { SelectedCustomer, OrderItemData } from "./wizard"

export function Step2Products({
  catalogData,
  customer,
  items,
  setItems,
  onBack,
  onNext
}: {
  catalogData: any[]
  customer: SelectedCustomer
  items: OrderItemData[]
  setItems: React.Dispatch<React.SetStateAction<OrderItemData[]>>
  onBack: () => void
  onNext: () => void
}) {
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null)
  const [selectedProdId, setSelectedProdId] = useState<string | null>(null)
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)
  
  const [qty, setQty] = useState<number>(1)
  const [sellingPrice, setSellingPrice] = useState<string>("")
  const [editingItemId, setEditingItemId] = useState<string | null>(null)

  const activeCategory = catalogData.find(c => c.id === selectedCatId)
  const activeProduct = activeCategory?.products.find((p: any) => p.id === selectedProdId)
  const activeVariant = activeProduct?.variants.find((v: any) => v.id === selectedVariantId)
  const pricingRule = activeVariant?.pricingRules?.[0]

  const handleSelectVariant = (vId: string) => {
    setSelectedVariantId(vId)
    const variant = activeProduct.variants.find((v: any) => v.id === vId)
    const pr = variant?.pricingRules?.[0]
    if (pr) {
      setSellingPrice(pr.minSellingPrice?.toString() || pr.costPrice?.toString() || "0")
    } else {
      setSellingPrice("")
    }
  }

  const handleAddOrUpdateItem = () => {
    if (!activeVariant) return
    const costPrice = Number(pricingRule?.costPrice || 0)
    const price = Number(sellingPrice)
    const quantity = Number(qty)
    if (price <= 0 || quantity <= 0) return

    const revenue = price * quantity
    const profit = revenue - (costPrice * quantity)

    if (editingItemId) {
      setItems(items.map(i => i.id === editingItemId ? {
        ...i,
        quantity,
        unitSellingPrice: price,
        totalRevenue: revenue,
        totalProfit: profit
      } : i))
      setEditingItemId(null)
    } else {
      setItems([...items, {
        id: Math.random().toString(),
        categoryId: activeCategory.id,
        categoryName: activeCategory.name,
        productId: activeProduct.id,
        productName: activeProduct.name,
        variantId: activeVariant.id,
        variantName: activeVariant.name,
        quantity,
        unitCostPrice: costPrice,
        unitSellingPrice: price,
        totalRevenue: revenue,
        totalProfit: profit
      }])
    }
    
    // Reset builder to Product level so they can add another variant quickly
    setSelectedVariantId(null)
    setQty(1)
  }

  const handleEdit = (item: OrderItemData) => {
    const cId = item.categoryId !== "unknown" ? item.categoryId : catalogData.find(c => c.name === item.categoryName)?.id || null
    setSelectedCatId(cId)
    const pId = item.productId !== "unknown" ? item.productId : catalogData.find(c => c.name === item.categoryName)?.products.find((p:any) => p.name === item.productName)?.id || null
    setSelectedProdId(pId)
    setSelectedVariantId(item.variantId)
    setQty(item.quantity)
    setSellingPrice(item.unitSellingPrice.toString())
    setEditingItemId(item.id)
  }

  const totalRevenue = items.reduce((sum, i) => sum + i.totalRevenue, 0)
  const totalProfit = items.reduce((sum, i) => sum + i.totalProfit, 0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in pb-32 md:pb-0">
      {/* Left: Drill Down Menu (70% width) */}
      <div className="md:col-span-7 lg:col-span-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}><ChevronLeft className="w-5 h-5" /></Button>
          <div>
            <h2 className="text-2xl font-semibold">Products</h2>
            <p className="text-sm text-muted-foreground">Order for {customer.shop_name}</p>
          </div>
        </div>

        {/* Level 1: Categories */}
        {!selectedCatId && (
          <div className="space-y-4 animate-in slide-in-from-bottom-2">
            <h3 className="text-lg font-medium text-slate-700">Select Category</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {catalogData.map(c => (
                <Button 
                  key={c.id} 
                  variant="outline" 
                  className="h-auto py-4 flex flex-col items-center gap-2"
                  onClick={() => setSelectedCatId(c.id)}
                >
                  <span className="font-semibold">{c.name}</span>
                  <span className="text-xs text-muted-foreground">{c.products.length} Products</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Level 2: Products */}
        {selectedCatId && !selectedProdId && (
          <div className="space-y-4 animate-in slide-in-from-right-2">
            <div className="flex items-center gap-2 mb-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedCatId(null)} className="text-muted-foreground">
                &larr; Back to Categories
              </Button>
              <span className="font-medium">{activeCategory?.name}</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {activeCategory?.products.map((p: any) => (
                <Card key={p.id} className="cursor-pointer hover:border-primary hover:shadow-sm transition-all" onClick={() => setSelectedProdId(p.id)}>
                  <CardContent className="p-4 text-center space-y-2">
                    <div className="font-semibold text-sm leading-tight">{p.name}</div>
                    <Badge variant="secondary" className="text-xs">{p.variants.length} Variants</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Level 3: Variants & Builder */}
        {selectedProdId && activeProduct && (
          <div className="space-y-4 animate-in slide-in-from-right-2">
            <div className="flex items-center gap-2 mb-4 border-b pb-4">
              <Button variant="ghost" size="sm" onClick={() => { setSelectedProdId(null); setSelectedVariantId(null); }} className="text-muted-foreground -ml-3">
                &larr; Back
              </Button>
              <span className="text-muted-foreground">{activeCategory?.name} / </span>
              <span className="font-medium text-lg">{activeProduct.name}</span>
            </div>
            
            <h4 className="font-medium mb-3">Select Variant</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {activeProduct.variants.map((v: any) => {
                const pr = v.pricingRules?.[0]
                const priceDisplay = pr ? `₹${Number(pr.minSellingPrice || pr.costPrice).toFixed(0)}` : "N/A"
                return (
                  <Card 
                    key={v.id} 
                    className={`cursor-pointer transition-all ${selectedVariantId === v.id ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'hover:border-primary/50'}`}
                    onClick={() => handleSelectVariant(v.id)}
                  >
                    <CardContent className="p-3 flex flex-col justify-center items-center text-center h-full gap-1">
                      <span className="font-semibold text-sm">{v.name}</span>
                      <span className="text-xs text-muted-foreground font-medium">{priceDisplay}</span>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Builder Area */}
            {activeVariant && (
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-5 animate-in slide-in-from-bottom-2">
                {!pricingRule ? (
                   <div className="flex flex-col items-center justify-center py-6 text-slate-500 space-y-2">
                     <AlertCircle className="w-8 h-8 text-amber-500" />
                     <p className="font-medium">Pricing unavailable</p>
                     <p className="text-sm">Cannot add this variant because it has no active pricing rules.</p>
                   </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Quantity</label>
                        <Input type="number" min="1" value={qty} onChange={e => setQty(Number(e.target.value))} className="h-12 text-lg" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Unit Price (₹)</label>
                        <Input type="number" value={sellingPrice} onChange={e => setSellingPrice(e.target.value)} className="h-12 text-lg" />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Revenue</div>
                        <div className="font-bold text-xl">₹{(Number(sellingPrice) * qty).toFixed(2)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Profit</div>
                        <div className="font-bold text-emerald-600 text-lg">₹{((Number(sellingPrice) * qty) - (Number(pricingRule.costPrice) * qty)).toFixed(2)}</div>
                      </div>
                    </div>

                    <Button 
                      className="w-full h-12 text-lg mt-2" 
                      onClick={handleAddOrUpdateItem}
                      disabled={Number(sellingPrice) <= 0 || qty <= 0}
                    >
                      {editingItemId ? "Update Item" : "Add to Order"}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Cart Summary (30% width on Desktop, Sticky Bottom on Mobile) */}
      <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-4 fixed bottom-0 left-0 right-0 md:relative bg-white md:bg-transparent p-4 md:p-0 border-t md:border-0 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-none z-50">
        <div className="bg-white rounded-xl md:border shadow-sm flex flex-col md:h-[calc(100vh-140px)]">
          <div className="p-4 border-b bg-slate-50 flex justify-between items-center hidden md:flex rounded-t-xl">
            <h3 className="font-semibold flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" /> Cart ({items.length})
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 hidden md:block">
            {items.length === 0 ? (
              <div className="text-center text-muted-foreground py-10">Cart is empty</div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="border rounded-lg p-3 text-sm relative group bg-white shadow-sm">
                  <div className="font-medium pr-8">{item.productName}</div>
                  <div className="text-muted-foreground text-xs mt-0.5">{item.variantName}</div>
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-muted-foreground text-xs">
                      {item.quantity} x ₹{item.unitSellingPrice.toFixed(2)}
                    </div>
                    <div className="font-semibold">₹{item.totalRevenue.toFixed(2)}</div>
                  </div>
                  
                  {/* Actions */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm p-1 rounded-md">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEdit(item)}>
                      <Edit2 className="w-3 h-3 text-blue-600" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setItems(items.filter(i => i.id !== item.id))}>
                      <Trash2 className="w-3 h-3 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="md:p-4 md:bg-slate-50 rounded-b-xl flex flex-col sm:flex-row md:flex-col gap-4 items-center justify-between">
            <div className="flex-1 w-full md:w-auto">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground font-medium">Items</span>
                <span className="font-medium">{items.length}</span>
              </div>
              <div className="flex justify-between text-sm md:mb-4">
                <span className="text-muted-foreground font-medium">Total</span>
                <span className="font-bold text-lg">₹{totalRevenue.toFixed(2)}</span>
              </div>
            </div>
            <Button className="w-full sm:w-auto md:w-full h-12" size="lg" disabled={items.length === 0} onClick={onNext}>
              Review Order
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
