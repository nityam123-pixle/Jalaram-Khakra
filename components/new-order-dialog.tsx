"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CustomerSearchInput } from "@/components/customer-search-input"
import { Plus, X, IndianRupee, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

import { getFullCatalog } from "@/app/actions/catalog"
import { createOrder, type OrderItemInput } from "@/app/actions/order"
import { CITIES } from "@/lib/supabase"

interface OrderItemRow {
  uiId: string
  categoryId: string
  productId: string
  variantId: string
  quantity: number
  sellingPrice: number
}

interface NewOrderDialogProps {
  trigger: React.ReactNode
  onOrderCreated?: () => void
}

export function NewOrderDialog({ trigger, onOrderCreated }: NewOrderDialogProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Catalog Data
  const [catalog, setCatalog] = useState<any[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)

  // Customer Data
  const [shopName, setShopName] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")

  // Items
  const [items, setItems] = useState<OrderItemRow[]>([])

  useEffect(() => {
    if (open && catalog.length === 0) {
      setCatalogLoading(true)
      getFullCatalog()
        .then((data) => {
          setCatalog(data)
          if (items.length === 0) {
            addItem(data)
          }
        })
        .catch((err) => {
          console.error("Failed to load catalog", err)
          toast({ title: "Error", description: "Failed to load product catalog", variant: "destructive" })
        })
        .finally(() => {
          setCatalogLoading(false)
        })
    }
  }, [open, catalog.length])

  const addItem = (catData = catalog) => {
    setItems((prev) => [
      ...prev,
      {
        uiId: Math.random().toString(36).substring(7),
        categoryId: "",
        productId: "",
        variantId: "",
        quantity: 1,
        sellingPrice: 0,
      },
    ])
  }

  const removeItem = (uiId: string) => {
    if (items.length > 1) {
      setItems(items.filter((i) => i.uiId !== uiId))
    }
  }

  const updateItem = (uiId: string, field: keyof OrderItemRow, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.uiId !== uiId) return item
        
        const updated = { ...item, [field]: value }

        // Handle cascading resets
        if (field === "categoryId") {
          updated.productId = ""
          updated.variantId = ""
          updated.sellingPrice = 0
        } else if (field === "productId") {
          updated.variantId = ""
          updated.sellingPrice = 0
        } else if (field === "variantId") {
          // Auto-set the selling price to the min price or MRP
          const cat = catalog.find(c => c.id === updated.categoryId)
          const prod = cat?.products.find((p: any) => p.id === updated.productId)
          const variant = prod?.variants.find((v: any) => v.id === value)
          if (variant && variant.pricingRules[0]) {
             const pricing = variant.pricingRules[0]
             updated.sellingPrice = Number(pricing.minSellingPrice || pricing.costPrice)
          }
        }

        return updated
      })
    )
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.sellingPrice), 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!shopName || !address || !city) {
      toast({ title: "Error", description: "Please fill in all customer fields", variant: "destructive" })
      return
    }

    const validItems = items.filter(i => i.variantId && i.quantity > 0 && i.sellingPrice > 0)
    if (validItems.length === 0) {
      toast({ title: "Error", description: "Please add at least one valid item", variant: "destructive" })
      return
    }

    setLoading(true)

    try {
      const orderItemsInput: OrderItemInput[] = validItems.map(i => ({
        variantId: i.variantId,
        quantity: i.quantity,
        sellingPrice: i.sellingPrice
      }))

      await createOrder({
        shopName,
        city,
        address,
        items: orderItemsInput
      })

      toast({
        title: "Success",
        description: `Order created successfully! Total: ₹${calculateTotal()}`,
      })

      // Reset
      setShopName("")
      setAddress("")
      setCity("")
      setItems([])
      setOpen(false)
      onOrderCreated?.()
    } catch (error: any) {
      console.error(error)
      toast({
        title: "Error",
        description: error.message || "Failed to create order",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
        </DialogHeader>
        
        {catalogLoading ? (
           <div className="py-8 text-center text-muted-foreground">Loading catalog...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Details */}
            <div className="space-y-4 bg-muted/30 p-4 rounded-lg border">
              <h3 className="text-lg font-medium">Customer Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shopName">Shop Name *</Label>
                  <CustomerSearchInput
                    id="shopName"
                    value={shopName}
                    onChange={setShopName}
                    onCustomerSelect={(customer) => {
                      setShopName(customer.shop_name)
                      setCity(customer.city)
                      setAddress(customer.address ?? "")
                    }}
                    placeholder="Enter shop name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Select value={city} onValueChange={setCity} required>
                    <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
                    <SelectContent>
                      {CITIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter complete address"
                  required
                />
              </div>
            </div>

            {/* Dynamic Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Order Items</h3>
                <div className="text-lg font-bold">Total: ₹{calculateTotal().toLocaleString()}</div>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => {
                  const selectedCat = catalog.find(c => c.id === item.categoryId)
                  const selectedProd = selectedCat?.products.find((p: any) => p.id === item.productId)
                  const selectedVariant = selectedProd?.variants.find((v: any) => v.id === item.variantId)
                  const pricing = selectedVariant?.pricingRules?.[0]

                  let priceHint = ""
                  if (pricing) {
                     priceHint = `Min: ₹${pricing.minSellingPrice || pricing.costPrice}`
                     if (pricing.maxSellingPrice) priceHint += ` | Max: ₹${pricing.maxSellingPrice}`
                  }

                  return (
                    <div key={item.uiId} className="flex flex-col md:flex-row items-end gap-3 p-3 border rounded-lg bg-card">
                      <div className="w-full md:w-48 space-y-2">
                        <Label>Category</Label>
                        <Select value={item.categoryId} onValueChange={(v) => updateItem(item.uiId, "categoryId", v)}>
                          <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                          <SelectContent>
                            {catalog.map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="w-full md:w-48 space-y-2">
                        <Label>Product</Label>
                        <Select disabled={!item.categoryId} value={item.productId} onValueChange={(v) => updateItem(item.uiId, "productId", v)}>
                          <SelectTrigger><SelectValue placeholder="Product" /></SelectTrigger>
                          <SelectContent>
                            {selectedCat?.products.map((p: any) => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="w-full md:w-32 space-y-2">
                        <Label>Variant</Label>
                        <Select disabled={!item.productId} value={item.variantId} onValueChange={(v) => updateItem(item.uiId, "variantId", v)}>
                          <SelectTrigger><SelectValue placeholder="Size/Type" /></SelectTrigger>
                          <SelectContent>
                            {selectedProd?.variants.map((v: any) => (
                              <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="w-full md:w-24 space-y-2">
                        <Label>Quantity</Label>
                        <Input 
                          type="number" 
                          min={1} 
                          value={item.quantity || ""} 
                          onChange={(e) => updateItem(item.uiId, "quantity", Number(e.target.value))} 
                        />
                      </div>

                      <div className="w-full md:w-32 space-y-2">
                        <Label className="flex justify-between">
                          <span>Price/Unit</span>
                        </Label>
                        <Input 
                          type="number" 
                          value={item.sellingPrice || ""} 
                          onChange={(e) => updateItem(item.uiId, "sellingPrice", Number(e.target.value))} 
                        />
                        {priceHint && <p className="text-[10px] text-muted-foreground whitespace-nowrap">{priceHint}</p>}
                      </div>

                      <div className="w-full md:w-24 space-y-2">
                        <Label>Total</Label>
                        <div className="flex items-center h-10 px-3 border rounded-md bg-muted text-sm font-medium">
                          ₹{item.quantity * item.sellingPrice}
                        </div>
                      </div>

                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive mb-1 md:mb-0 md:h-10 shrink-0" 
                        onClick={() => removeItem(item.uiId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>

              <Button type="button" variant="outline" onClick={() => addItem()} className="w-full mt-2">
                <Plus className="h-4 w-4 mr-2" /> Add Item
              </Button>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Order"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
