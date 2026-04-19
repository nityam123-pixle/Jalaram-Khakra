"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { CustomerSearchInput } from "@/components/customer-search-input"
import {
  CITIES,
  KHAKHRA_TYPES,
  PATRA_PRICE_MIN,
  PATRA_PRICE_MAX,
  PATRA_1KG_PRICE_MIN,
  PATRA_1KG_PRICE_MAX,
  PATRA_200G_PRICE_MIN,
  PATRA_200G_PRICE_MAX,
  BHAKARWADI_PRICE_MIN,
  BHAKARWADI_PACKET_PRICE,
  supabase,
  type Order,
  getPriceRange,
} from "@/lib/supabase"
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

interface FulvadiItem {
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
  const [patraPrice, setPatraPrice] = useState(PATRA_PRICE_MIN)
  const [wantsSejwan, setWantsSejwan] = useState(false)
  const [sejwanItems, setSejwanItems] = useState<
    { type: string; packetQuantity: number; packetPrice: number }[]
  >([])
  const [wantsMathiya, setWantsMathiya] = useState(false)
  const [mathiyaItems, setMathiyaItems] = useState<
    { type: string; packetQuantity: number; packetPrice: number }[]
  >([])
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
  const [wantsFulvadi, setWantsFulvadi] = useState(false)
  const [fulvadiPackets, setFulvadiPackets] = useState(0)
  const [fulvadiPrice] = useState(90)
  const [fulvadiItems, setFulvadiItems] = useState<FulvadiItem[]>([])

  // Populate form when order changes
  useEffect(() => {
    if (order) {
      setShopName(order.shop_name)
      setAddress(order.address)
      setCity(order.city)
      setWantsPatra(order.wants_patra)
      setPatraPackets(order.patra_packets ?? 0)
      setPatraPrice(order.patra_price_per_packet ?? PATRA_PRICE_MIN)
      setWantsFulvadi(order.wants_fulvadi)
      setFulvadiPackets(order.fulvadi_packets ?? 0)

      if (order.khakhra_items && order.khakhra_items.length > 0) {
        // Separate regular khakhra items from bhakarwadi, fulvadi, sejwan
        const regularItems = order.khakhra_items.filter((item) => {
          const khakhraType = KHAKHRA_TYPES.find((t) => t.name === item.khakhra_type)
          return (
            khakhraType?.category !== "bhakarwadi" &&
            khakhraType?.category !== "fulvadi" &&
            khakhraType?.category !== "sejwan" &&
            khakhraType?.category !== "mathiyaPuri"
          )
        })

        const bhakarwadiItemsFromOrder = order.khakhra_items.filter((item) => {
          const khakhraType = KHAKHRA_TYPES.find((t) => t.name === item.khakhra_type)
          return khakhraType?.category === "bhakarwadi"
        })

        const fulvadiItemsFromOrder = order.khakhra_items.filter((item) => {
          const khakhraType = KHAKHRA_TYPES.find((t) => t.name === item.khakhra_type)
          return khakhraType?.category === "fulvadi"
        })

        const sejwanItemsFromOrder = order.khakhra_items.filter((item) => {
          const khakhraType = KHAKHRA_TYPES.find((t) => t.name === item.khakhra_type)
          return khakhraType?.category === "sejwan"
        })

        const mathiyaItemsFromOrder = order.khakhra_items.filter((item) => {
          const khakhraType = KHAKHRA_TYPES.find((t) => t.name === item.khakhra_type)
          return khakhraType?.category === "mathiyaPuri"
        })

        setKhakhraItems(
          regularItems.length > 0
            ? regularItems.map((item) => ({
                id: item.id,
                type: item.khakhra_type,
                quantity: item.quantity_kg,
                price: item.price_per_kg,
                sellBy: item.is_packet_item ? "packet" : "kg",
                packetQuantity: item.packet_quantity || 0,
                packetPrice: item.price_per_packet || 0,
              }))
            : [{ type: "", quantity: 0, price: 200, sellBy: "kg" }],
        )

        setWantsBhakarwadi(bhakarwadiItemsFromOrder.length > 0)
        setBhakarwadiItems(
          bhakarwadiItemsFromOrder.map((item) => ({
            type: item.khakhra_type,
            quantity: item.quantity_kg,
            price: item.price_per_kg,
            sellBy: item.is_packet_item ? "packet" : "kg",
            packetQuantity: item.packet_quantity || 0,
            packetPrice: item.price_per_packet || BHAKARWADI_PACKET_PRICE,
          })),
        )

        setFulvadiItems(
          fulvadiItemsFromOrder.map((item) => ({
            type: item.khakhra_type,
            quantity: item.quantity_kg,
            price: item.price_per_kg,
            sellBy: item.is_packet_item ? "packet" : "kg",
            packetQuantity: item.packet_quantity || 0,
            packetPrice: item.price_per_packet || 90,
          })),
        )

        if (sejwanItemsFromOrder.length > 0) {
          setWantsSejwan(true)
          setSejwanItems(
            sejwanItemsFromOrder.map((item) => ({
              type: item.khakhra_type,
              packetQuantity: item.packet_quantity || 0,
              packetPrice: item.price_per_packet || 0,
            })),
          )
        } else {
          setWantsSejwan(false)
          setSejwanItems([])
        }

        if (mathiyaItemsFromOrder.length > 0) {
          setWantsMathiya(true)
          setMathiyaItems(
            mathiyaItemsFromOrder.map((item) => ({
              type: item.khakhra_type,
              packetQuantity: item.packet_quantity || 0,
              packetPrice: item.price_per_packet || 0,
            })),
          )
        } else {
          setWantsMathiya(false)
          setMathiyaItems([])
        }
      } else {
        setKhakhraItems([{ type: "", quantity: 0, price: 200, sellBy: "kg" }])
        setWantsBhakarwadi(false)
        setBhakarwadiItems([])
        setFulvadiItems([])
        setWantsSejwan(false)
        setSejwanItems([])
        setWantsMathiya(false)
        setMathiyaItems([])
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
    setKhakhraItems((prevItems) => {
      const updated = [...prevItems]
      const currentItem = { ...updated[index] }

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
        if (field === "quantity" || field === "packetQuantity" || field === "price" || field === "packetPrice") {
          ;(currentItem as any)[field] = Number(value)
        } else {
          ;(currentItem as any)[field] = value
        }
      }
      updated[index] = currentItem
      return updated
    })
  }

  const addBhakarwadiItem = () => {
    setBhakarwadiItems([
      ...bhakarwadiItems,
      { type: "", quantity: 0, price: BHAKARWADI_PACKET_PRICE, sellBy: "packet" },
    ])
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
        currentItem.sellBy = "packet"
        currentItem.price = BHAKARWADI_PACKET_PRICE
        currentItem.packetPrice = BHAKARWADI_PACKET_PRICE
        currentItem.quantity = 0
        currentItem.packetQuantity = 0
      } else if (field === "sellBy") {
        currentItem.sellBy = value
        currentItem.quantity = 0
        currentItem.packetQuantity = 0
        if (value === "packet") {
          currentItem.packetPrice = BHAKARWADI_PACKET_PRICE
          currentItem.price = BHAKARWADI_PACKET_PRICE
        } else {
          currentItem.price = BHAKARWADI_PRICE_MIN
        }
      } else {
        currentItem[field] = value
      }

      updated[index] = currentItem
      return updated
    })
  }

  const addFulvadiItem = () => {
    setFulvadiItems([...fulvadiItems, { type: "", quantity: 0, price: 90, sellBy: "packet" }])
  }

  const removeFulvadiItem = (index: number) => {
    if (fulvadiItems.length > 1) {
      setFulvadiItems(fulvadiItems.filter((_, i) => i !== index))
    }
  }

  const updateFulvadiItem = (index: number, field: string, value: any) => {
    setFulvadiItems((prev) => {
      const updated = [...prev]
      const currentItem = { ...updated[index] }

      if (field === "type") {
        const fulvadiType = KHAKHRA_TYPES.find((t) => t.name === value && t.category === "fulvadi")
        currentItem.type = value
        currentItem.sellBy = "packet"
        currentItem.price = 90
        currentItem.packetPrice = 90
        currentItem.quantity = 0
        currentItem.packetQuantity = 0
      } else if (field === "sellBy") {
        currentItem.sellBy = value
        currentItem.quantity = 0
        currentItem.packetQuantity = 0
        if (value === "packet") {
          currentItem.packetPrice = 90
          currentItem.price = 90
        } else {
          currentItem.price = 90
        }
      } else {
        currentItem[field] = value
      }

      updated[index] = currentItem
      return updated
    })
  }

  const addSejwanItem = () => {
    setSejwanItems((prev) => [
      ...prev,
      { type: "", packetQuantity: 0, packetPrice: PATRA_1KG_PRICE_MIN },
    ])
  }

  const removeSejwanItem = (index: number) => {
    setSejwanItems((prev) => prev.filter((_, i) => i !== index))
  }

  const updateSejwanItem = (index: number, field: string, value: string | number) => {
    setSejwanItems((prev) => {
      const updated = [...prev]
      const currentItem = { ...updated[index] }
      if (field === "type") {
        const sejwanType = KHAKHRA_TYPES.find((t) => t.name === value && t.category === "sejwan")
        currentItem.type = value as string
        currentItem.packetPrice = sejwanType?.basePacketPrice ?? PATRA_1KG_PRICE_MIN
        currentItem.packetQuantity = 0
      } else {
        ;(currentItem as any)[field] = value
      }
      updated[index] = currentItem
      return updated
    })
  }

  const calculateSejwanItemTotal = (item: { type: string; packetQuantity: number; packetPrice: number }) => {
    if (!item.type) return 0
    return (item.packetQuantity || 0) * (item.packetPrice || 0)
  }

  const addMathiyaItem = () => {
    setMathiyaItems((prev) => [...prev, { type: "", packetQuantity: 0, packetPrice: 42 }])
  }

  const removeMathiyaItem = (index: number) => {
    setMathiyaItems((prev) => prev.filter((_, i) => i !== index))
  }

  const updateMathiyaItem = (index: number, field: string, value: string | number) => {
    setMathiyaItems((prev) => {
      const updated = [...prev]
      const currentItem = { ...updated[index] }
      if (field === "type") {
        const mt = KHAKHRA_TYPES.find((t) => t.name === value && t.category === "mathiyaPuri")
        currentItem.type = value as string
        currentItem.packetPrice = mt?.basePacketPrice ?? 42
        currentItem.packetQuantity = 0
      } else {
        ;(currentItem as any)[field] = value
      }
      updated[index] = currentItem
      return updated
    })
  }

  const calculateMathiyaItemTotal = (item: { type: string; packetQuantity: number; packetPrice: number }) => {
    if (!item.type) return 0
    return (item.packetQuantity || 0) * (item.packetPrice || 0)
  }

  const mathiyaProfitPreview = (item: { type: string; packetQuantity: number; packetPrice: number }) => {
    const mt = KHAKHRA_TYPES.find((t) => t.name === item.type && t.category === "mathiyaPuri")
    if (!mt || !item.packetQuantity) return 0
    const cost = mt.basePacketCost ?? 0
    return (item.packetPrice - cost) * item.packetQuantity
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

  const calculateBhakarwadiItemTotal = (item: any) => {
    if (!item.type) return 0
    if (item.sellBy === "packet" && item.packetQuantity && item.packetPrice) {
      return item.packetQuantity * item.packetPrice
    } else if (item.quantity > 0) {
      return item.quantity * item.price
    }
    return 0
  }

  const calculateFulvadiItemTotal = (item: any) => {
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

    const fulvadiTotal = fulvadiItems.reduce((sum, item) => {
      return sum + calculateFulvadiItemTotal(item)
    }, 0)

    const patraTotal = wantsPatra ? patraPackets * (patraPrice || PATRA_PRICE_MIN) : 0
    const sejwanTotal = sejwanItems.reduce((sum, item) => sum + calculateSejwanItemTotal(item), 0)
    const mathiyaTotal = mathiyaItems.reduce((sum, item) => sum + calculateMathiyaItemTotal(item), 0)
    return khakhraTotal + bhakarwadiTotal + fulvadiTotal + patraTotal + sejwanTotal + mathiyaTotal
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!order) return

    setLoading(true)

    try {
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

      const validFulvadiItems = fulvadiItems.filter(
        (item) =>
          item.type &&
          (item.quantity > 0 || (item.sellBy === "packet" && item.packetQuantity && item.packetQuantity > 0)),
      )

      const validSejwanItems = sejwanItems.filter((item) => item.type && (item.packetQuantity ?? 0) > 0)
      const validMathiyaItems = mathiyaItems.filter((item) => item.type && (item.packetQuantity ?? 0) > 0)

      if (
        validKhakhraItems.length === 0 &&
        validBhakarwadiItems.length === 0 &&
        validFulvadiItems.length === 0 &&
        !wantsPatra &&
        validSejwanItems.length === 0 &&
        validMathiyaItems.length === 0
      ) {
        toast({
          title: "Error",
          description: "Please add at least one item or Patra/Sejwan/Mathiya",
          variant: "destructive",
        })
        return
      }

      if (wantsPatra && patraPackets <= 0) {
        toast({
          title: "Error",
          description: "Please specify the number of Patra packets",
          variant: "destructive",
        })
        return
      }

      if (wantsSejwan && validSejwanItems.length === 0) {
        toast({
          title: "Error",
          description: "Please add at least one Sejwan Spring Viti item with quantity",
          variant: "destructive",
        })
        return
      }

      if (wantsMathiya && validMathiyaItems.length === 0) {
        toast({
          title: "Error",
          description: "Please add at least one Mathiya Puri item with quantity",
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
        }, 0) +
        validFulvadiItems.reduce((sum, item) => {
          if (item.sellBy === "packet") {
            return sum + (item.packetQuantity || 0) * 0.2
          } else {
            return sum + item.quantity
          }
        }, 0) +
        validSejwanItems.reduce((sum, item) => {
          const sejwanType = KHAKHRA_TYPES.find((t) => t.name === item.type && t.category === "sejwan")
          const weight = (sejwanType as any)?.packetWeight ?? 0.2
          return sum + (item.packetQuantity || 0) * weight
        }, 0) +
        validMathiyaItems.reduce((sum, item) => sum + (item.packetQuantity || 0) * 0.2, 0)

      const totalAmount = calculateTotal()

      const updateData: any = {
        shop_name: shopName,
        address,
        city,
        wants_patra: wantsPatra,
        patra_packets: wantsPatra ? patraPackets : 0,
        patra_price_per_packet: patraPrice || PATRA_PRICE_MIN,
        wants_fulvadi: wantsFulvadi,
        fulvadi_packets: wantsFulvadi ? fulvadiPackets : 0,
        fulvadi_price_per_packet: 90,
        total_khakhra_kg: totalKhakhraKg,
        total_amount: totalAmount,
      }

      const { error: orderError } = await supabase.from("orders").update(updateData).eq("id", order.id)

      if (orderError) throw orderError

      const { error: deleteError } = await supabase.from("khakhra_items").delete().eq("order_id", order.id)

      if (deleteError) throw deleteError

      if (
        validKhakhraItems.length > 0 ||
        validBhakarwadiItems.length > 0 ||
        validFulvadiItems.length > 0 ||
        validSejwanItems.length > 0 ||
        validMathiyaItems.length > 0
      ) {
        const allItemsToInsert = [
          ...validKhakhraItems.map((item) => {
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
                price_per_kg: KHAKHRA_TYPES.find((t) => t.name === item.type)?.basePrice || 0,
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
                price_per_kg: BHAKARWADI_PRICE_MIN,
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
          ...validFulvadiItems.map((item) => {
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
                price_per_kg: 90,
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
          ...validSejwanItems.map((item) => {
            const sejwanType = KHAKHRA_TYPES.find((t) => t.name === item.type && t.category === "sejwan")
            const packetWeight = (sejwanType as any)?.packetWeight ?? 0.2
            return {
              order_id: order.id,
              khakhra_type: item.type,
              quantity_kg: (item.packetQuantity || 0) * packetWeight,
              total_price: (item.packetQuantity || 0) * (item.packetPrice || 0),
              is_packet_item: true,
              packet_quantity: item.packetQuantity || 0,
              price_per_packet: item.packetPrice || 0,
              price_per_kg: 0,
            }
          }),
          ...validMathiyaItems.map((item) => ({
            order_id: order.id,
            khakhra_type: item.type,
            quantity_kg: (item.packetQuantity || 0) * 0.2,
            total_price: (item.packetQuantity || 0) * (item.packetPrice || 0),
            is_packet_item: true,
            packet_quantity: item.packetQuantity || 0,
            price_per_packet: item.packetPrice || 0,
            price_per_kg: 0,
          })),
        ]

        const { error: itemsError } = await supabase.from("khakhra_items").insert(allItemsToInsert)

        if (itemsError) throw itemsError
      }

      toast({
        title: "Success",
        description: `Order updated successfully! Total: ₹${totalAmount}`,
      })
      onOpenChange(false)
      onOrderUpdated()
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("orders:refresh"))
      }
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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

          {/* Fulvadi Option */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Fulvadi Option</h3>
            <div className="flex items-center space-x-2">
              <Switch
                id="wantsFulvadi"
                checked={wantsFulvadi}
                onCheckedChange={(checked) => {
                  setWantsFulvadi(checked)
                  if (checked && fulvadiItems.length === 0) {
                    setFulvadiItems([{ type: "", quantity: 0, price: 90, sellBy: "packet" }])
                  }
                }}
              />
              <Label htmlFor="wantsFulvadi">Customer wants Fulvadi (₹90 per 500g packet)</Label>
            </div>
            {wantsFulvadi && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Add Fulvadi items with fixed pricing</p>
                  <Button type="button" onClick={addFulvadiItem} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Fulvadi
                  </Button>
                </div>
                {fulvadiItems.map((item, index) => {
                  const fulvadiTypes = KHAKHRA_TYPES.filter((t) => t.category === "fulvadi")

                  return (
                    <div
                      key={index}
                      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 p-3 border rounded-lg items-end"
                    >
                      <div className="space-y-2">
                        <Label>Fulvadi Type</Label>
                        <Select value={item.type} onValueChange={(value) => updateFulvadiItem(index, "type", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {fulvadiTypes.map((type) => (
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
                          onValueChange={(value) => updateFulvadiItem(index, "sellBy", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="packet">Per Packet (₹90)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

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
                            updateFulvadiItem(index, item.sellBy === "packet" ? "packetQuantity" : "quantity", value)
                          }}
                          placeholder="0"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Total</Label>
                        <div className="flex items-center h-10 px-3 border rounded-md bg-muted text-sm">
                          ₹{calculateFulvadiItemTotal(item)}
                        </div>
                      </div>

                      {fulvadiItems.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeFulvadiItem(index)}
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

          {/* Sejwan Spring Viti (Snack) */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Sejwan Spring Viti (Snack)</h3>
            <div className="flex items-center space-x-2">
              <Switch
                id="wantsSejwan"
                checked={wantsSejwan}
                onCheckedChange={(checked) => {
                  setWantsSejwan(checked)
                  if (checked && sejwanItems.length === 0) {
                    setSejwanItems([{ type: "", packetQuantity: 0, packetPrice: PATRA_1KG_PRICE_MIN }])
                  }
                }}
              />
              <Label htmlFor="wantsSejwan">
                Customer wants Sejwan Spring Viti (1kg ₹{PATRA_1KG_PRICE_MIN}-{PATRA_1KG_PRICE_MAX}, 200g ₹{PATRA_200G_PRICE_MIN}-{PATRA_200G_PRICE_MAX})
              </Label>
            </div>
            {wantsSejwan && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Add Sejwan Spring Viti 1kg or 200g packs</p>
                  <Button type="button" onClick={addSejwanItem} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Sejwan
                  </Button>
                </div>
                {sejwanItems.map((item, index) => {
                  const sejwanTypes = KHAKHRA_TYPES.filter((t) => t.category === "sejwan")
                  const selectedSejwan = sejwanTypes.find((t) => t.name === item.type)
                  const priceRange = selectedSejwan ? getPriceRange(selectedSejwan, true) : []

                  return (
                    <div
                      key={index}
                      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 p-3 border rounded-lg items-end"
                    >
                      <div className="space-y-2">
                        <Label>Pack type</Label>
                        <Select
                          value={item.type}
                          onValueChange={(value) => updateSejwanItem(index, "type", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select pack" />
                          </SelectTrigger>
                          <SelectContent>
                            {sejwanTypes.map((type) => (
                              <SelectItem key={type.name} value={type.name}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedSejwan && (
                        <div className="space-y-2">
                          <Label>Price per pack</Label>
                          <Select
                            value={item.packetPrice?.toString() ?? ""}
                            onValueChange={(value) => updateSejwanItem(index, "packetPrice", Number.parseInt(value))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {priceRange.map((price) => (
                                <SelectItem key={price} value={price.toString()}>
                                  ₹{price}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          min="0"
                          value={item.packetQuantity || 0}
                          onChange={(e) =>
                            updateSejwanItem(index, "packetQuantity", Number.parseInt(e.target.value) || 0)
                          }
                          placeholder="0"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Total</Label>
                        <div className="flex items-center h-10 px-3 border rounded-md bg-muted text-sm">
                          ₹{calculateSejwanItemTotal(item)}
                        </div>
                      </div>

                      {sejwanItems.length >= 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeSejwanItem(index)}
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

          {/* Mathiya Puri */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Mathiya Puri</h3>
            <div className="flex items-center space-x-2">
              <Switch
                id="wantsMathiya"
                checked={wantsMathiya}
                onCheckedChange={(checked) => {
                  setWantsMathiya(checked)
                  if (checked && mathiyaItems.length === 0) {
                    setMathiyaItems([{ type: "", packetQuantity: 0, packetPrice: 42 }])
                  }
                }}
              />
              <Label htmlFor="wantsMathiya">Customer wants Mathiya Puri (200gm packets)</Label>
            </div>
            {wantsMathiya && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Mini or Moti — set selling price per packet</p>
                  <Button type="button" onClick={addMathiyaItem} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add line
                  </Button>
                </div>
                {mathiyaItems.map((item, index) => {
                  const mathiyaTypes = KHAKHRA_TYPES.filter((t) => t.category === "mathiyaPuri")
                  const selected = mathiyaTypes.find((t) => t.name === item.type)
                  const mrp = selected && "mrp" in selected ? (selected as { mrp: number }).mrp : undefined
                  const cost = selected?.basePacketCost

                  return (
                    <div
                      key={index}
                      className="grid grid-cols-1 gap-3 rounded-lg border p-3 sm:grid-cols-2 md:grid-cols-6 md:items-end"
                    >
                      <div className="space-y-2 md:col-span-2">
                        <Label>Product</Label>
                        <Select value={item.type} onValueChange={(value) => updateMathiyaItem(index, "type", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select variety" />
                          </SelectTrigger>
                          <SelectContent>
                            {mathiyaTypes.map((type) => (
                              <SelectItem key={type.name} value={type.name}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Packets</Label>
                        <Input
                          type="number"
                          min={0}
                          value={item.packetQuantity || 0}
                          onChange={(e) =>
                            updateMathiyaItem(index, "packetQuantity", Number.parseInt(e.target.value) || 0)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Price / packet (₹)</Label>
                        <Input
                          type="number"
                          min={selected?.basePacketPrice ?? 42}
                          max={selected?.maxPacketPrice ?? 50}
                          step={1}
                          value={item.packetPrice || ""}
                          onChange={(e) =>
                            updateMathiyaItem(index, "packetPrice", Number.parseFloat(e.target.value) || 0)
                          }
                        />
                        {selected && mrp != null && cost != null && (
                          <p className="text-xs text-muted-foreground">
                            MRP: ₹{mrp.toLocaleString("en-IN")} | Our cost: ₹{cost.toLocaleString("en-IN")}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Line total</Label>
                        <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm">
                          ₹{calculateMathiyaItemTotal(item).toLocaleString("en-IN")}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Est. profit</Label>
                        <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm text-muted-foreground">
                          ₹{mathiyaProfitPreview(item).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                        </div>
                      </div>
                      {mathiyaItems.length >= 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="md:col-span-6"
                          onClick={() => removeMathiyaItem(index)}
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
                    setBhakarwadiItems([{ type: "", quantity: 0, price: BHAKARWADI_PACKET_PRICE, sellBy: "packet" }])
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

                      {item.sellBy === "kg" && (
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
              Add Khakhra items if customer wants them, or leave empty for Patra-only orders
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
                        {KHAKHRA_TYPES.filter(
                          (type) =>
                            type.category !== "bhakarwadi" &&
                            type.category !== "fulvadi" &&
                            type.category !== "sejwan" &&
                            type.category !== "mathiyaPuri",
                        ).map((type) => (
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
                          {priceRange.map((price) => (
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
