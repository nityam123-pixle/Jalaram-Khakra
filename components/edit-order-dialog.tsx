"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { CITIES, KHAKHRA_TYPES, PATRA_PRICE_MIN, PATRA_PRICE_MAX, supabase, type Order } from "@/lib/supabase"
import { Plus, X, IndianRupee } from "lucide-react"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface KhakhraItem {
  id?: string
  type: string
  quantity: number
  price: number
  sellBy: "kg" | "packet"
  packetQuantity?: number
  packetPrice?: number
}

interface EditOrderDialogProps {
  order: Order | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onOrderUpdated: () => void
}

export function EditOrderDialog({ order, open, onOpenChange, onOrderUpdated }: EditOrderDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [shopName, setShopName] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [khakhraItems, setKhakhraItems] = useState<KhakhraItem[]>([{ type: "", quantity: 0, price: 200, sellBy: "kg" }])
  const [wantsPatra, setWantsPatra] = useState(false)
  const [patraPackets, setPatraPackets] = useState(0)
  const [patraPrice, setPatraPrice] = useState(80)

  // Populate form when order changes
  useEffect(() => {
    if (order) {
      setShopName(order.shop_name)
      setAddress(order.address)
      setCity(order.city)
      setWantsPatra(order.wants_patra)
      setPatraPackets(order.patra_packets)
      // Handle both new and old orders - fallback to 80 if column doesn't exist
      setPatraPrice(order.patra_price_per_packet || 80)

      if (order.khakhra_items && order.khakhra_items.length > 0) {
        setKhakhraItems(
          order.khakhra_items.map((item) => ({
            id: item.id,
            type: item.khakhra_type,
            quantity: item.quantity_kg,
            price: item.price_per_kg,
            sellBy: item.is_packet_item ? "packet" : "kg",
            packetQuantity: item.packet_quantity || 0,
            packetPrice: item.price_per_packet || 0,
          })),
        )
      } else {
        setKhakhraItems([{ type: "", quantity: 0, price: 200, sellBy: "kg" }])
      }
    }
  }, [order])

  const addKhakhraItem = () => {
    setKhakhraItems([...khakhraItems, { type: "", quantity: 0, price: 200, sellBy: "kg" }])
  }

  const removeKhakhraItem = (index: number) => {
    if (khakhraItems.length > 1) {
      setKhakhraItems(khakhraItems.filter((_, i) => i !== index))
    }
  }

  const updateKhakhraItem = (index: number, field: keyof KhakhraItem, value: string | number | boolean) => {
    const updated = [...khakhraItems]
    const currentItem = updated[index]

    if (field === "type") {
      const selectedType = KHAKHRA_TYPES.find((t) => t.name === value)
      updated[index] = {
        ...currentItem,
        type: value as string,
        price: selectedType?.price || 200,
      }
    } else {
      updated[index] = { ...currentItem, [field]: value }
    }

    setKhakhraItems(updated)
  }

  const calculateTotal = () => {
    let khakhraTotal = 0

    khakhraItems.forEach((item) => {
      if (item.type && item.quantity > 0) {
        if (item.sellBy === "kg") {
          khakhraTotal += item.quantity * item.price
        } else if (item.sellBy === "packet" && item.packetQuantity && item.packetPrice) {
          khakhraTotal += item.packetQuantity * item.packetPrice
        }
      }
    })

    const patraTotal = wantsPatra ? patraPackets * (patraPrice || 80) : 0
    return khakhraTotal + patraTotal
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!order) return

    setLoading(true)

    try {
      // Validate form
      if (!shopName || !address || !city) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }

      const validKhakhraItems = khakhraItems.filter((item) => item.type && item.quantity > 0)

      // Check if order has either Khakhra items OR Patra
      if (validKhakhraItems.length === 0 && !wantsPatra) {
        toast({
          title: "Error",
          description: "Please add at least one Khakhra item or select Patra",
          variant: "destructive",
        })
        return
      }

      // If only Patra is selected, validate Patra quantity
      if (wantsPatra && patraPackets <= 0) {
        toast({
          title: "Error",
          description: "Please specify the number of Patra packets",
          variant: "destructive",
        })
        return
      }

      const totalKhakhraKg = validKhakhraItems.reduce((sum, item) => sum + item.quantity, 0)
      const totalAmount = calculateTotal()

      // Prepare update object - only include patra_price_per_packet if the column exists
      const updateData: any = {
        shop_name: shopName,
        address,
        city,
        wants_patra: wantsPatra,
        patra_packets: wantsPatra ? patraPackets : 0,
        total_khakhra_kg: totalKhakhraKg,
        total_amount: totalAmount,
      }

      // Try to include patra_price_per_packet, but handle gracefully if column doesn't exist
      try {
        updateData.patra_price_per_packet = patraPrice || 80
      } catch (error) {
        console.log("patra_price_per_packet column not available yet")
      }

      // Update order
      const { error: orderError } = await supabase.from("orders").update(updateData).eq("id", order.id)

      if (orderError) throw orderError

      // Delete existing khakhra items
      const { error: deleteError } = await supabase.from("khakhra_items").delete().eq("order_id", order.id)

      if (deleteError) throw deleteError

      // Insert updated khakhra items only if there are valid items
      if (validKhakhraItems.length > 0) {
        const khakhraItemsToInsert = validKhakhraItems.map((item) => {
          const baseItem = {
            order_id: order.id,
            khakhra_type: item.type,
            quantity_kg: item.quantity,
            price_per_kg: item.price,
          }

          if (item.sellBy === "kg") {
            return {
              ...baseItem,
              total_price: item.quantity * item.price,
              is_packet_item: false,
            }
          } else {
            return {
              ...baseItem,
              is_packet_item: true,
              packet_quantity: item.packetQuantity,
              price_per_packet: item.packetPrice,
              total_price: item.packetQuantity! * item.packetPrice!,
            }
          }
        })

        const { error: itemsError } = await supabase.from("khakhra_items").insert(khakhraItemsToInsert)

        if (itemsError) throw itemsError
      }

      toast({
        title: "Success",
        description: `Order updated successfully! Total: ₹${totalAmount}`,
      })
      onOpenChange(false)
      onOrderUpdated()
    } catch (error) {
      console.error("Error updating order:", error)
      toast({
        title: "Error",
        description: "Failed to update order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!order) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Order - {order.shop_name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Customer Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shopName">Shop Name *</Label>
                <Input
                  id="shopName"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="Enter shop name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Select value={city} onValueChange={setCity} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {CITIES.map((cityOption) => (
                      <SelectItem key={cityOption} value={cityOption}>
                        {cityOption}
                      </SelectItem>
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

          {/* Patra Option - Moved up for better UX */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Patra Option</h3>
            <div className="flex items-center space-x-2">
              <Switch id="wantsPatra" checked={wantsPatra} onCheckedChange={setWantsPatra} />
              <Label htmlFor="wantsPatra">
                Customer wants Patra (₹{PATRA_PRICE_MIN}-₹{PATRA_PRICE_MAX} per packet)
              </Label>
            </div>
            {wantsPatra && (
              <div className="flex items-end gap-2">
                <div className="w-32 space-y-2">
                  <Label htmlFor="patraPackets">Number of packets *</Label>
                  <Input
                    id="patraPackets"
                    type="number"
                    min="1"
                    value={patraPackets}
                    onChange={(e) => setPatraPackets(Number.parseInt(e.target.value) || 0)}
                    placeholder="0"
                    required={wantsPatra}
                  />
                </div>
                <div className="w-24 space-y-2">
                  <Label htmlFor="patraPrice">Price per packet</Label>
                  <Input
                    id="patraPrice"
                    type="number"
                    min={PATRA_PRICE_MIN}
                    max={PATRA_PRICE_MAX}
                    value={patraPrice}
                    onChange={(e) => setPatraPrice(Number.parseInt(e.target.value) || 80)}
                    placeholder="80"
                  />
                </div>
                <div className="w-20 space-y-2">
                  <Label>Total</Label>
                  <div className="flex items-center h-10 px-3 border rounded-md bg-muted text-sm">
                    ₹{patraPackets * patraPrice}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Khakhra Selection - Made optional */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Khakhra Selection (Optional)</h3>
              <Button type="button" onClick={addKhakhraItem} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Add Khakhra items if customer wants them, or leave empty for Patra-only orders
            </p>
            {khakhraItems.map((item, index) => (
              <div key={index} className="flex items-end gap-2 p-3 border rounded-lg">
                <div className="flex-1 space-y-2">
                  <Label>Khakhra Type</Label>
                  <Select value={item.type} onValueChange={(value) => updateKhakhraItem(index, "type", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select khakhra type (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {KHAKHRA_TYPES.map((type) => (
                        <SelectItem key={type.name} value={type.name}>
                          {type.name} - ₹{type.price}/kg
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Sell By</Label>
                  <Select value={item.sellBy} onValueChange={(value) => updateKhakhraItem(index, "sellBy", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">Per Kg</SelectItem>
                      <SelectItem value="packet">Per Packet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {item.sellBy === "kg" ? (
                  <div className="w-24 space-y-2">
                    <Label>Quantity (kg)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      value={item.quantity}
                      onChange={(e) => updateKhakhraItem(index, "quantity", Number.parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                ) : (
                  <>
                    <div className="w-24 space-y-2">
                      <Label>No. of Packets</Label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={item.packetQuantity}
                        onChange={(e) =>
                          updateKhakhraItem(index, "packetQuantity", Number.parseFloat(e.target.value) || 0)
                        }
                        placeholder="0"
                      />
                    </div>
                    <div className="w-24 space-y-2">
                      <Label>Price per packet</Label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={item.packetPrice}
                        onChange={(e) =>
                          updateKhakhraItem(index, "packetPrice", Number.parseFloat(e.target.value) || 0)
                        }
                        placeholder="0"
                      />
                    </div>
                  </>
                )}

                <div className="w-20 space-y-2">
                  <Label>Total</Label>
                  <div className="flex items-center h-10 px-3 border rounded-md bg-muted text-sm">
                    ₹
                    {item.sellBy === "kg"
                      ? item.quantity > 0 && item.type
                        ? (item.quantity * item.price).toFixed(0)
                        : "0"
                      : item.packetQuantity! > 0 && item.type
                        ? (item.packetQuantity! * item.packetPrice!).toFixed(0)
                        : "0"}
                  </div>
                </div>
                {khakhraItems.length > 1 && (
                  <Button type="button" variant="outline" size="sm" onClick={() => removeKhakhraItem(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Order Total */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Order Total:</span>
              <div className="flex items-center gap-1">
                <IndianRupee className="h-4 w-4" />
                <span>{calculateTotal()}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Order"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
