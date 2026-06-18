"use client"

import { useState } from "react"
import { ChevronLeft, ShoppingCart, Trash2, AlertCircle, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategoryTab, setSelectedCategoryTab] = useState("ALL")
  
  // Track temporary inputs for quantity and price per variant ID
  const [variantInputs, setVariantInputs] = useState<Record<string, { qty: number; price: string }>>({})

  // Flatten catalogData into a single list of variants
  const allVariants = catalogData.flatMap((cat) => 
    cat.products.flatMap((prod: any) => 
      prod.variants.map((v: any) => ({
        id: v.id,
        name: v.name,
        productId: prod.id,
        productName: prod.name,
        categoryId: cat.id,
        categoryName: cat.name,
        sku: v.sku,
        pricingRule: v.pricingRules?.[0] || null,
        unitType: v.unitType,
      }))
    )
  )

  // Group variants by category
  const groupedByCategory = allVariants.reduce((acc, v) => {
    const cat = v.categoryName
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(v)
    return acc
  }, {} as Record<string, typeof allVariants>)

  const getQty = (variantId: string) => {
    if (variantInputs[variantId]?.qty !== undefined) {
      return variantInputs[variantId].qty
    }
    const cartItem = items.find(i => i.variantId === variantId)
    return cartItem ? cartItem.quantity : 1
  }

  const getPrice = (variantId: string, pricingRule: any) => {
    if (variantInputs[variantId]?.price !== undefined) {
      return variantInputs[variantId].price
    }
    const cartItem = items.find(i => i.variantId === variantId)
    if (cartItem) return cartItem.unitSellingPrice.toString()
    
    return pricingRule?.minSellingPrice?.toString() || pricingRule?.costPrice?.toString() || ""
  }

  const setQtyForVariant = (variantId: string, value: number) => {
    const nextQty = Math.max(1, value)
    setVariantInputs(prev => ({
      ...prev,
      [variantId]: {
        ...prev[variantId],
        qty: nextQty,
        price: getPrice(variantId, allVariants.find(v => v.id === variantId)?.pricingRule)
      }
    }))
  }

  const setPriceForVariant = (variantId: string, value: string) => {
    setVariantInputs(prev => ({
      ...prev,
      [variantId]: {
        ...prev[variantId],
        price: value,
        qty: getQty(variantId)
      }
    }))
  }

  const handleAddOrUpdate = (variant: any) => {
    const qty = getQty(variant.id)
    const priceStr = getPrice(variant.id, variant.pricingRule)
    const price = Number(priceStr)
    const costPrice = Number(variant.pricingRule?.costPrice || 0)
    
    if (qty <= 0 || price <= 0) return

    const revenue = price * qty
    const profit = revenue - (costPrice * qty)

    const existingIndex = items.findIndex(i => i.variantId === variant.id)
    if (existingIndex >= 0) {
      setItems(prev => prev.map((item, idx) => idx === existingIndex ? {
        ...item,
        quantity: qty,
        unitSellingPrice: price,
        totalRevenue: revenue,
        totalProfit: profit
      } : item))
    } else {
      setItems(prev => [...prev, {
        id: Math.random().toString(),
        categoryId: variant.categoryId,
        categoryName: variant.categoryName,
        productId: variant.productId,
        productName: variant.productName,
        variantId: variant.id,
        variantName: variant.name,
        quantity: qty,
        unitCostPrice: costPrice,
        unitSellingPrice: price,
        totalRevenue: revenue,
        totalProfit: profit
      }])
    }
  }

  const handleRemove = (variantId: string) => {
    setItems(prev => prev.filter(i => i.variantId !== variantId))
    setVariantInputs(prev => {
      const next = { ...prev }
      delete next[variantId]
      return next
    })
  }

  const totalRevenue = items.reduce((sum, i) => sum + i.totalRevenue, 0)

  // Check if any categories match filters
  const visibleCategories = Object.entries(groupedByCategory).filter(([category, categoryVariants]) => {
    if (selectedCategoryTab !== "ALL" && category !== selectedCategoryTab) {
      return false
    }
    const matchingCount = categoryVariants.filter(v => {
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase()
        return (
          v.productName.toLowerCase().includes(query) ||
          v.name.toLowerCase().includes(query)
        )
      }
      return true
    }).length
    return matchingCount > 0
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in pb-32 md:pb-0">
      {/* Left: Searchable Catalog List (8 cols) */}
      <div className="md:col-span-8 space-y-5">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}><ChevronLeft className="w-5 h-5" /></Button>
          <div>
            <h2 className="text-2xl font-semibold">Select Products</h2>
            <p className="text-sm text-muted-foreground">Order for {customer.shop_name}</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by product name, packet size..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-8 h-10 bg-background"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchQuery("")}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          <Button
            variant={selectedCategoryTab === "ALL" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategoryTab("ALL")}
            className="rounded-full shrink-0"
          >
            All Products
          </Button>
          {Object.keys(groupedByCategory).map((cat) => (
            <Button
              key={cat}
              variant={selectedCategoryTab === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategoryTab(cat)}
              className="rounded-full shrink-0"
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Product Catalog List */}
        <div className="space-y-6 max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
          {visibleCategories.length === 0 ? (
            <div className="text-center text-muted-foreground py-12 bg-muted/20 rounded-xl border border-dashed">
              No matching products found
            </div>
          ) : (
            visibleCategories.map(([category, categoryVariants]) => {
              const matchingVariants = categoryVariants.filter(v => {
                if (searchQuery.trim() !== "") {
                  const query = searchQuery.toLowerCase()
                  return (
                    v.productName.toLowerCase().includes(query) ||
                    v.name.toLowerCase().includes(query)
                  )
                }
                return true
              })

              return (
                <Card key={category} className="overflow-hidden shadow-sm border border-border">
                  <div className="bg-muted/40 px-4 py-2 border-b border-border/50">
                    <h3 className="font-semibold text-xs flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
                      {category}
                    </h3>
                  </div>
                  <div className="divide-y divide-border">
                    {matchingVariants.map((v) => {
                      const pricingRule = v.pricingRule
                      const min = pricingRule?.minSellingPrice ? Number(pricingRule.minSellingPrice) : null
                      const max = pricingRule?.maxSellingPrice ? Number(pricingRule.maxSellingPrice) : null
                      
                      const qtyVal = getQty(v.id)
                      const priceVal = getPrice(v.id, pricingRule)
                      const numPrice = Number(priceVal)

                      const isTooLow = min !== null && numPrice < min
                      const isTooHigh = max !== null && numPrice > max
                      const isPriceInvalid = isTooLow || isTooHigh || isNaN(numPrice) || numPrice <= 0

                      const isInCart = items.some(i => i.variantId === v.id)

                      return (
                        <div key={v.id} className="p-4 space-y-3 hover:bg-muted/5 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex-1">
                              <div className="font-medium text-base text-foreground">{v.productName}</div>
                              <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 mt-0.5">
                                <span>Variant: <strong className="text-foreground">{v.name}</strong></span>
                                {pricingRule ? (
                                  <span className="text-slate-500 font-medium">
                                    {min !== null && max !== null && `Price Range: ₹${min} - ₹${max}`}
                                    {min !== null && max === null && `Min Price: ₹${min}`}
                                    {min === null && max !== null && `Max Price: ₹${max}`}
                                    {min === null && max === null && `Price: ₹${pricingRule.costPrice}`}
                                  </span>
                                ) : (
                                  <span className="text-destructive font-medium">⚠️ No pricing configured</span>
                                )}
                              </div>
                            </div>

                            {pricingRule && (
                              <div className="flex flex-wrap items-center gap-3">
                                {/* Quantity Controls */}
                                <div className="flex items-center border border-input rounded-md h-10 bg-background overflow-hidden">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-full w-8 rounded-none border-r hover:bg-muted"
                                    onClick={() => setQtyForVariant(v.id, qtyVal - 1)}
                                    disabled={qtyVal <= 1}
                                  >
                                    -
                                  </Button>
                                  <span className="w-9 text-center font-semibold text-sm">{qtyVal}</span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-full w-8 rounded-none border-l hover:bg-muted"
                                    onClick={() => setQtyForVariant(v.id, qtyVal + 1)}
                                  >
                                    +
                                  </Button>
                                </div>

                                {/* Price Input */}
                                <div className="w-24 relative">
                                  <Input
                                    type="number"
                                    step="any"
                                    value={priceVal}
                                    onChange={(e) => setPriceForVariant(v.id, e.target.value)}
                                    className={`h-10 text-right pr-6 bg-background ${isPriceInvalid ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                  />
                                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
                                </div>

                                {/* Actions */}
                                {isInCart ? (
                                  <div className="flex items-center gap-1.5">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      className="h-10 border-emerald-600/30 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 font-medium px-3 flex gap-1.5 items-center"
                                      onClick={() => handleAddOrUpdate(v)}
                                      disabled={isPriceInvalid}
                                    >
                                      Update
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                      onClick={() => handleRemove(v.id)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    type="button"
                                    className="h-10 px-4 font-semibold"
                                    onClick={() => handleAddOrUpdate(v)}
                                    disabled={isPriceInvalid}
                                  >
                                    Add
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Price Range Validation Warning */}
                          {isPriceInvalid && pricingRule && (
                            <div className="text-[11px] text-destructive flex items-center gap-1 font-medium bg-destructive/5 px-2 py-1 rounded border border-destructive/10 w-fit">
                              <AlertCircle className="w-3.5 h-3.5" />
                              {min !== null && max !== null && `Selling price must be between ₹${min} and ₹${max}`}
                              {min !== null && max === null && `Selling price must be at least ₹${min}`}
                              {min === null && max !== null && `Selling price must not exceed ₹${max}`}
                              {(min === null && max === null) && `Enter a valid price above ₹0`}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )
            })
          )}
        </div>
      </div>

      {/* Right: Sticky Cart Summary (4 cols) */}
      <div className="md:col-span-4 flex flex-col gap-4 fixed bottom-0 left-0 right-0 md:relative bg-card dark:bg-card p-4 md:p-0 border-t border-border md:border-0 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)] md:shadow-none z-50">
        <div className="bg-card dark:bg-card rounded-xl border border-border shadow-sm flex flex-col md:h-[calc(100vh-140px)]">
          <div className="p-4 border-b border-border bg-muted/40 flex justify-between items-center hidden md:flex rounded-t-xl">
            <h3 className="font-semibold flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" /> Cart ({items.length})
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 hidden md:block">
            {items.length === 0 ? (
              <div className="text-center text-muted-foreground py-10">Cart is empty</div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="border border-border rounded-lg p-3 text-sm relative group bg-card shadow-sm">
                  <div className="font-medium pr-8">{item.productName}</div>
                  <div className="text-muted-foreground text-xs mt-0.5">{item.variantName}</div>
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-muted-foreground text-xs">
                      {item.quantity} x ₹{item.unitSellingPrice.toFixed(2)}
                    </div>
                    <div className="font-semibold">₹{item.totalRevenue.toFixed(2)}</div>
                  </div>
                  
                  {/* Quick Delete */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 dark:bg-background/90 border border-border backdrop-blur-sm p-1 rounded-md">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemove(item.variantId)}>
                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="md:p-4 md:bg-muted/40 border-t border-border rounded-b-xl flex flex-col sm:flex-row md:flex-col gap-4 items-center justify-between">
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
