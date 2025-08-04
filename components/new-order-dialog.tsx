"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  CITIES,
  KHAKHRA_TYPES,
  PATRA_PRICE_MIN,
  PATRA_PRICE_MAX,
  supabase,
  getPriceRange,
  calculateDynamicProfit,
} from "@/lib/supabase"
import { Plus, X, IndianRupee } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface KhakhraItem {
  type: string
  quantity: number
  price: number
  // New fields for packet-based items
  sellBy: "kg" | "packet"
  packetQuantity?: number
  packetPrice?: number
}

interface NewOrderDialogProps {
  trigger: React.ReactNode
  onOrderCreated: () => void
}

export function NewOrderDialog({ trigger, onOrderCreated }: NewOrderDialogProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [shopName, setShopName] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [khakhraItems, setKhakhraItems] = useState<KhakhraItem[]>([{ type: "", quantity: 0, price: 200, sellBy: "kg" }])
  const [wantsPatra, setWantsPatra] = useState(false)
  const [patraPackets, setPatraPackets] = useState(0)
  const [patraPrice, setPatraPrice] = useState(PATRA_PRICE_MIN) // Default to min patra price
  const [wantsBhakarwadi, setWantsBhakarwadi] = useState(false)
  const [bhakarwadiItems, setBhakarwadiItems] = useState<
    {
      type: string
      quantity: number
      price: number
      sellBy: "kg" | "packet"
      packetQuantity?: number
      packetPrice?: number
    }[]
  >([])

  const addKhakhraItem = () => {
    setKhakhraItems([...khakhraItems, { type: "", quantity: 0, price: 200, sellBy: "kg" }])
  }

  const removeKhakhraItem = (index: number) => {
    if (khakhraItems.length > 1) {
      setKhakhraItems(khakhraItems.filter((_, i) => i !== index))
    }
  }

  const calculateItemTotal = (item: KhakhraItem) => {
    if (!item.type) return 0

    if (item.sellBy === "packet" && item.packetQuantity && item.packetPrice) {
      return item.packetQuantity * item.packetPrice
    } else if (item.quantity > 0) {
      return item.quantity * item.price
    }
    return 0
  }

  const calculateItemProfit = (item: KhakhraItem) => {
    if (!item.type) return 0

    const khakhraType = KHAKHRA_TYPES.find((t) => t.name === item.type)
    if (!khakhraType) return 0

    if (item.sellBy === "packet" && item.packetQuantity && item.packetPrice) {
      const profitPerPacket = calculateDynamicProfit(khakhraType, item.packetPrice, true)
      return item.packetQuantity * profitPerPacket
    } else if (item.quantity > 0) {
      const profitPerKg = calculateDynamicProfit(khakhraType, item.price, false)
      return item.quantity * profitPerKg
    }
    return 0
  }

  const updateKhakhraItem = (index: number, field: keyof KhakhraItem, value: string | number | boolean) => {
    setKhakhraItems((prevItems) => {
      const updated = [...prevItems]
      const currentItem = { ...updated[index] } // Create a shallow copy to avoid direct mutation

      if (field === "type") {
        const newSelectedType = KHAKHRA_TYPES.find((t) => t.name === value)
        const newSellBy = newSelectedType?.sellBy === "both" ? "packet" : "kg"
        currentItem.type = value as string
        currentItem.sellBy = newSellBy
        currentItem.price = newSellBy === "kg" ? newSelectedType?.basePrice || 200 : 0
        currentItem.packetPrice = newSellBy === "packet" ? newSelectedType?.basePacketPrice || 0 : 0
        currentItem.quantity = 0
        currentItem.packetQuantity = 0
      } else if (field === "sellBy") {
        const selectedType = KHAKHRA_TYPES.find((t) => t.name === currentItem.type)
        currentItem.sellBy = value as "kg" | "packet"
        currentItem.quantity = 0
        currentItem.packetQuantity = 0
        currentItem.price = currentItem.sellBy === "kg" ? selectedType?.basePrice || 200 : 0
        currentItem.packetPrice = currentItem.sellBy === "packet" ? selectedType?.basePacketPrice || 0 : 0
      } else {
        // Handle quantity, price, packetQuantity, packetPrice directly
        if (field === "quantity" || field === "packetQuantity" || field === "price" || field === "packetPrice") {
          ;(currentItem as any)[field] = Number(value) // Ensure it's a number
        } else {
          ;(currentItem as any)[field] = value
        }
      }
      updated[index] = currentItem
      return updated
    })
  }

  const addBhakarwadiItem = () => {
    setBhakarwadiItems([...bhakarwadiItems, { type: "", quantity: 0, price: 160, sellBy: "kg" }])
  }

  const removeBhakarwadiItem = (index: number) => {
    if (bhakarwadiItems.length > 1) {
      setBhakarwadiItems(bhakarwadiItems.filter((_, i) => i !== index))
    }
  }

  const updateBhakarwadiItem = (index: number, field: string, value: any) => {
    setBhakarwadiItems((prev) => {
      const updated = [...prev]
      const currentItem = { ...updated[index] }

      if (field === "type") {
        const bhakarwadiType = KHAKHRA_TYPES.find((t) => t.name === value && t.category === "bhakarwadi")
        currentItem.type = value
        currentItem.sellBy = "packet" // Default to packet for Bhakarwadi
        currentItem.price = 160 // Default kg price
        currentItem.packetPrice = 60 // Fixed MRP
        currentItem.quantity = 0
        currentItem.packetQuantity = 0
      } else if (field === "sellBy") {
        currentItem.sellBy = value
        currentItem.quantity = 0
        currentItem.packetQuantity = 0
        if (value === "packet") {
          currentItem.packetPrice = 60
        } else {
          currentItem.price = 160 // Default to minimum kg price
        }
      } else {
        currentItem[field] = value
      }

      updated[index] = currentItem
      return updated
    })
  }

  const calculateBhakarwadiItemTotal = (item: any) => {
    if (!item.type) return 0
    if (item.sellBy === "packet" && item.packetQuantity && item.packetPrice) {
      return item.packetQuantity * item.packetPrice
    } else if (item.quantity > 0) {
      return item.quantity * item.price
    }
    return 0
  }

  const calculateTotal = () => {
    const khakhraTotal = khakhraItems.reduce((sum, item) => {
      return sum + calculateItemTotal(item)
    }, 0)

    const bhakarwadiTotal = bhakarwadiItems.reduce((sum, item) => {
      return sum + calculateBhakarwadiItemTotal(item)
    }, 0)

    const patraTotal = wantsPatra ? patraPackets * (patraPrice || PATRA_PRICE_MIN) : 0
    return khakhraTotal + bhakarwadiTotal + patraTotal
  }

  const calculateTotalProfit = () => {
    const khakhraProfit = khakhraItems.reduce((sum, item) => {
      return sum + calculateItemProfit(item)
    }, 0)

    const patraProfit = wantsPatra
      ? patraPackets *
        (patraPrice >= PATRA_PRICE_MAX
          ? 21
          : patraPrice <= PATRA_PRICE_MIN
            ? 11
            : Math.round(11 + ((patraPrice - PATRA_PRICE_MIN) / (PATRA_PRICE_MAX - PATRA_PRICE_MIN)) * 10))
      : 0
    return khakhraProfit + patraProfit
  }

  const resetForm = () => {
    setShopName("")
    setAddress("")
    setCity("")
    setKhakhraItems([{ type: "", quantity: 0, price: 200, sellBy: "kg" }])
    setWantsPatra(false)
    setPatraPackets(0)
    setPatraPrice(PATRA_PRICE_MIN)
    setWantsBhakarwadi(false)
    setBhakarwadiItems([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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

      const validKhakhraItems = khakhraItems.filter(
        (item) =>
          item.type &&
          (item.quantity > 0 || (item.sellBy === "packet" && item.packetQuantity && item.packetQuantity > 0)),
      )

      const validBhakarwadiItems = bhakarwadiItems.filter(
        (item) =>
          item.type &&
          (item.quantity > 0 || (item.sellBy === "packet" && item.packetQuantity && item.packetQuantity > 0)),
      )

      // Check if order has at least one item
      if (validKhakhraItems.length === 0 && validBhakarwadiItems.length === 0 && !wantsPatra) {
        toast({
          title: "Error",
          description: "Please add at least one item or select Patra",
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

      const totalKhakhraKg =
        validKhakhraItems.reduce((sum, item) => {
          if (item.sellBy === "packet") {
            return sum + (item.packetQuantity || 0) * 0.2
          } else {
            return sum + item.quantity
          }
        }, 0) +
        validBhakarwadiItems.reduce((sum, item) => {
          if (item.sellBy === "packet") {
            return sum + (item.packetQuantity || 0) * 0.2
          } else {
            return sum + item.quantity
          }
        }, 0)
      const totalAmount = calculateTotal()

      // Prepare insert object
      const insertData: any = {
        shop_name: shopName,
        address,
        city,
        wants_patra: wantsPatra,
        patra_packets: wantsPatra ? patraPackets : 0,
        total_khakhra_kg: totalKhakhraKg,
        total_amount: totalAmount,
        status: "pending",
      }

      // Try to include patra_price_per_packet
      try {
        insertData.patra_price_per_packet = patraPrice || PATRA_PRICE_MIN
      } catch (error) {
        console.log("patra_price_per_packet column not available yet")
      }

      // Insert order
      const { data: order, error: orderError } = await supabase.from("orders").insert(insertData).select().single()

      if (orderError) throw orderError

      // Insert khakhra items only if there are valid items
      if (validKhakhraItems.length > 0 || validBhakarwadiItems.length > 0) {
        const allItemsToInsert = [
          ...validKhakhraItems.map((item) => {
            const baseItem = {
              order_id: order.id,
              khakhra_type: item.type,
            }

            if (item.sellBy === "packet" && item.packetQuantity && item.packetPrice) {
              return {
                ...baseItem,
                quantity_kg: item.packetQuantity * 0.2, // Convert packets to kg for storage
                total_price: item.packetQuantity * item.packetPrice,
                is_packet_item: true,
                packet_quantity: item.packetQuantity,
                price_per_packet: item.packetPrice,
                price_per_kg: KHAKHRA_TYPES.find((t) => t.name === item.type)?.basePrice || 0, // Store base kg price for consistency
              }
            } else {
              return {
                ...baseItem,
                quantity_kg: item.quantity,
                total_price: item.quantity * item.price,
                is_packet_item: false,
                packet_quantity: 0,
                price_per_packet: 0,
                price_per_kg: item.price,
              }
            }
          }),
          ...validBhakarwadiItems.map((item) => {
            const baseItem = {
              order_id: order.id,
              khakhra_type: item.type,
            }

            if (item.sellBy === "packet" && item.packetQuantity && item.packetPrice) {
              return {
                ...baseItem,
                quantity_kg: item.packetQuantity * 0.2,
                total_price: item.packetQuantity * item.packetPrice,
                is_packet_item: true,
                packet_quantity: item.packetQuantity,
                price_per_packet: item.packetPrice,
                price_per_kg: KHAKHRA_TYPES.find((t) => t.name === item.type)?.basePrice || 160,
              }
            } else {
              return {
                ...baseItem,
                quantity_kg: item.quantity,
                total_price: item.quantity * item.price,
                is_packet_item: false,
                packet_quantity: 0,
                price_per_packet: 0,
                price_per_kg: item.price,
              }
            }
          }),
        ]

        const { error: itemsError } = await supabase.from("khakhra_items").insert(allItemsToInsert)

        if (itemsError) throw itemsError
      }

      // Success message without profit information
      toast({
        title: "Success",
        description: `Order created successfully! Total: ₹${totalAmount}`,
      })
      resetForm()
      setOpen(false)
      onOrderCreated()
    } catch (error) {
      console.error("Error creating order:", error)
      toast({
        title: "Error",
        description: "Failed to create order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
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

          {/* Patra Option */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Patra Option</h3>
            <div className="flex items-center space-x-2">
              <Switch id="wantsPatra" checked={wantsPatra} onCheckedChange={setWantsPatra} />
              <Label htmlFor="wantsPatra">
                Customer wants Patra (₹{PATRA_PRICE_MIN}-₹{PATRA_PRICE_MAX} per packet)
              </Label>
            </div>
            {wantsPatra && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 items-end mt-4">
                <div className="space-y-2">
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
                <div className="space-y-2">
                  <Label htmlFor="patraPrice">Price per packet</Label>
                  <Select
                    value={patraPrice.toString()}
                    onValueChange={(value) => setPatraPrice(Number.parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: PATRA_PRICE_MAX - PATRA_PRICE_MIN + 1 }, (_, i) => PATRA_PRICE_MIN + i).map(
                        (price) => (
                          <SelectItem key={price} value={price.toString()}>
                            ₹{price}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Total</Label>
                  <div className="flex items-center h-10 px-3 border rounded-md bg-muted text-sm">
                    ₹{patraPackets * patraPrice}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bhakarwadi Option */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Bhakarwadi Option</h3>
            <div className="flex items-center space-x-2">
              <Switch
                id="wantsBhakarwadi"
                checked={wantsBhakarwadi}
                onCheckedChange={(checked) => {
                  setWantsBhakarwadi(checked)
                  if (checked && bhakarwadiItems.length === 0) {
                    setBhakarwadiItems([{ type: "", quantity: 0, price: 160, sellBy: "packet" }])
                  }
                }}
              />
              <Label htmlFor="wantsBhakarwadi">Customer wants Bhakarwadi (₹60 per packet or ₹160-200 per kg)</Label>
            </div>
            {wantsBhakarwadi && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Add Bhakarwadi items with flexible pricing</p>
                  <Button type="button" onClick={addBhakarwadiItem} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Bhakarwadi
                  </Button>
                </div>
                {bhakarwadiItems.map((item, index) => {
                  const bhakarwadiTypes = KHAKHRA_TYPES.filter((t) => t.category === "bhakarwadi")
                  const selectedType = bhakarwadiTypes.find((t) => t.name === item.type)

                  return (
                    <div
                      key={index}
                      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 p-3 border rounded-lg items-end"
                    >
                      <div className="space-y-2">
                        <Label>Bhakarwadi Type</Label>
                        <Select value={item.type} onValueChange={(value) => updateBhakarwadiItem(index, "type", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {bhakarwadiTypes.map((type) => (
                              <SelectItem key={type.name} value={type.name}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Sell By</Label>
                        <Select
                          value={item.sellBy}
                          onValueChange={(value) => updateBhakarwadiItem(index, "sellBy", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="packet">Per Packet (₹60)</SelectItem>
                            <SelectItem value="kg">Per Kg (₹160-200)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Add Price Selection for kg sales */}
                      {item.sellBy === "kg" && selectedType && (
                        <div className="space-y-2">
                          <Label>Price per kg</Label>
                          <Select
                            value={item.price?.toString() || ""}
                            onValueChange={(value) => updateBhakarwadiItem(index, "price", Number.parseInt(value))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select price" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 41 }, (_, i) => 160 + i).map((price) => (
                                <SelectItem key={price} value={price.toString()}>
                                  ₹{price}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>{item.sellBy === "packet" ? "Packets" : "Quantity (kg)"}</Label>
                        <Input
                          type="number"
                          min="0"
                          step={item.sellBy === "packet" ? "1" : "0.5"}
                          value={item.sellBy === "packet" ? item.packetQuantity || 0 : item.quantity}
                          onChange={(e) => {
                            const value =
                              item.sellBy === "packet"
                                ? Number.parseInt(e.target.value) || 0
                                : Number.parseFloat(e.target.value) || 0
                            updateBhakarwadiItem(index, item.sellBy === "packet" ? "packetQuantity" : "quantity", value)
                          }}
                          placeholder="0"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Total</Label>
                        <div className="flex items-center h-10 px-3 border rounded-md bg-muted text-sm">
                          ₹{calculateBhakarwadiItemTotal(item)}
                        </div>
                      </div>

                      {bhakarwadiItems.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeBhakarwadiItem(index)}
                          className="col-span-full sm:col-span-1"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Khakhra Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Khakhra Selection (Optional)</h3>
              <Button type="button" onClick={addKhakhraItem} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Add Khakhra items with flexible pricing, or leave empty for Patra-only orders
            </p>
            {khakhraItems.map((item, index) => {
              const selectedType = KHAKHRA_TYPES.find((t) => t.name === item.type)
              const canSellByPacket = selectedType?.sellBy === "both"
              const priceRange = selectedType ? getPriceRange(selectedType, item.sellBy === "packet") : []

              return (
                <div
                  key={index}
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 p-3 border rounded-lg items-end"
                >
                  <div className="col-span-full lg:col-span-2 space-y-2">
                    <Label>Khakhra Type</Label>
                    <Select value={item.type} onValueChange={(value) => updateKhakhraItem(index, "type", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select khakhra type (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {KHAKHRA_TYPES.filter((type) => type.category !== "bhakarwadi").map((type) => (
                          <SelectItem key={type.name} value={type.name}>
                            {type.name} - ₹{type.basePrice}
                            {type.maxPrice > type.basePrice ? `-${type.maxPrice}` : ""}/kg
                            {(type.category === "bhakri" || type.category === "farali") &&
                              ` (₹${type.basePacketPrice}-${type.maxPacketPrice}/packet)`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sell By Selection for Bhakri/Farali items */}
                  {canSellByPacket && item.type && (
                    <div className="space-y-2">
                      <Label>Sell By</Label>
                      <Select
                        value={item.sellBy}
                        onValueChange={(value: "kg" | "packet") => updateKhakhraItem(index, "sellBy", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">Per Kg</SelectItem>
                          <SelectItem value="packet">Per Packet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Price Selection */}
                  {selectedType && (
                    <div className="space-y-2">
                      <Label>Price</Label>
                      <Select
                        value={(item.sellBy === "packet" ? item.packetPrice : item.price)?.toString() || ""}
                        onValueChange={(value) =>
                          updateKhakhraItem(
                            index,
                            item.sellBy === "packet" ? "packetPrice" : "price",
                            Number.parseInt(value),
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {priceRange.map((price) => {
                            // Profit display removed from here
                            return (
                              <SelectItem key={price} value={price.toString()}>
                                ₹{price}
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>{item.sellBy === "packet" ? "Packets" : "Quantity (kg)"}</Label>
                    <Input
                      type="number"
                      min="0"
                      step={item.sellBy === "packet" ? "1" : "0.5"}
                      value={item.sellBy === "packet" ? item.packetQuantity || 0 : item.quantity}
                      onChange={(e) => {
                        const value =
                          item.sellBy === "packet"
                            ? Number.parseInt(e.target.value) || 0
                            : Number.parseFloat(e.target.value) || 0
                        updateKhakhraItem(index, item.sellBy === "packet" ? "packetQuantity" : "quantity", value)
                      }}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Total</Label>
                    <div className="flex items-center h-10 px-3 border rounded-md bg-muted text-sm">
                      ₹{calculateItemTotal(item)}
                    </div>
                  </div>

                  {khakhraItems.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeKhakhraItem(index)}
                      className="col-span-full sm:col-span-1"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )
            })}
          </div>

          {/* Order Summary */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Order Total:</span>
              <div className="flex items-center gap-1">
                <IndianRupee className="h-4 w-4" />
                <span>{calculateTotal()}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Order"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
