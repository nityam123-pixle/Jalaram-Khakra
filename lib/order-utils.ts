import { calculateOrderProfit, calculateOrderTotalAmount } from "./supabase"

export interface OrderTotals {
  totalRevenue: number
  totalCost: number
  totalProfit: number
  marginPercent: number
  totalKhakhraKg: number
  packetTotal: number
  boxTotal: number
}

/**
 * Calculates complete, accurate revenue, cost, profit, and margin for an order.
 * Handles both new OrderItem schemas and legacy orders seamlessly.
 */
export function getOrderTotals(order: any): OrderTotals {
  if (!order) {
    return {
      totalRevenue: 0,
      totalCost: 0,
      totalProfit: 0,
      marginPercent: 0,
      totalKhakhraKg: 0,
      packetTotal: 0,
      boxTotal: 0,
    }
  }

  const items = order.items || []
  const itemsRevenue = items.reduce(
    (sum: number, i: any) => sum + (Number(i.totalRevenue) || 0),
    0
  )
  const itemsCost = items.reduce(
    (sum: number, i: any) => sum + (Number(i.totalCost) || 0),
    0
  )
  const itemsProfit = items.reduce(
    (sum: number, i: any) => sum + (Number(i.totalProfit) || 0),
    0
  )

  const orderTotalAmount = Number(order.total_amount) || 0

  let totalRevenue = itemsRevenue
  let totalCost = itemsCost
  let totalProfit = itemsProfit

  // If order items exist and their revenue matches order.total_amount, trust items
  if (orderTotalAmount > 0) {
    totalRevenue = orderTotalAmount
    totalProfit = itemsProfit > 0 ? itemsProfit : (calculateOrderProfit(order).totalProfit || 0)
    totalCost = Math.max(0, totalRevenue - totalProfit)
  } else if (itemsRevenue > 0) {
    totalRevenue = itemsRevenue
    totalCost = itemsCost
    totalProfit = itemsProfit
  } else {
    // Fallback calculation from legacy order fields
    totalRevenue = calculateOrderTotalAmount(order)
    const legacy = calculateOrderProfit(order)
    totalProfit = legacy.totalProfit || 0
    totalCost = Math.max(0, totalRevenue - totalProfit)
  }

  const marginPercent = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

  // Quantity totals
  let totalKhakhraKg = Number(order.total_khakhra_kg) || 0
  let packetTotal = (Number(order.patra_packets) || 0) +
    (Number(order.fulvadi_packets) || 0) +
    (Number(order.chikki_packets) || 0) +
    (Number(order.bhakarwadi_packets) || 0)
  let boxTotal = 0

  if (items.length > 0) {
    let itemsKg = 0
    let itemsPacket = 0
    let itemsBox = 0

    items.forEach((item: any) => {
      const unit = (item.variant?.unitType || item.unitType || "PACKET").toUpperCase()
      const qty = Number(item.quantity) || 0
      if (unit === "KG") itemsKg += qty
      else if (unit === "BOX") itemsBox += qty
      else itemsPacket += qty
    })

    if (itemsKg > 0) totalKhakhraKg = itemsKg
    if (itemsPacket > 0) packetTotal = itemsPacket
    if (itemsBox > 0) boxTotal = itemsBox
  }

  return {
    totalRevenue,
    totalCost,
    totalProfit,
    marginPercent,
    totalKhakhraKg,
    packetTotal,
    boxTotal,
  }
}

export interface UnifiedLineItem {
  id: string
  productName: string
  variantName: string
  categoryName: string
  quantity: number
  unitType: 'KG' | 'PACKET' | 'BOX' | string
  unitPrice: number
  totalPrice: number
}

/**
 * Returns complete, real line items for an order by examining order.items (new schema),
 * order.khakhra_items (legacy/introspected table), and snack flags.
 * Never fabricates or returns fake placeholder items.
 */
export function getUnifiedOrderItems(order: any): UnifiedLineItem[] {
  if (!order) return []
  const list: UnifiedLineItem[] = []

  // 1. Check order.items (new OrderItem schema)
  if (Array.isArray(order.items) && order.items.length > 0) {
    order.items.forEach((item: any, idx: number) => {
      const unit = item.variant?.unitType || (item.variantName?.toLowerCase().includes("kg") ? "KG" : "PACKET")
      list.push({
        id: item.id || `item-${idx}`,
        productName: item.productName || "Product",
        variantName: item.variantName || "Standard",
        categoryName: item.categoryName || "General",
        quantity: Number(item.quantity || 0),
        unitType: unit,
        unitPrice: Number(item.unitSellingPrice || 0),
        totalPrice: Number(item.totalRevenue || 0),
      })
    })
  }

  // 2. Check order.khakhra_items (introspected historical table)
  if (Array.isArray(order.khakhra_items) && order.khakhra_items.length > 0) {
    // Only supplement if items list did not already capture items
    if (list.length === 0) {
      order.khakhra_items.forEach((k: any, idx: number) => {
        const isPacket = Boolean(k.is_packet_item)
        list.push({
          id: k.id || `khakhra-${idx}`,
          productName: `${k.khakhra_type || "Khakhra"} Khakhra`,
          variantName: isPacket ? "Packet" : "Loose (kg)",
          categoryName: "Khakhra",
          quantity: isPacket ? Number(k.packet_quantity || 0) : Number(k.quantity_kg || 0),
          unitType: isPacket ? "PACKET" : "KG",
          unitPrice: isPacket ? Number(k.price_per_packet || 0) : Number(k.price_per_kg || 200),
          totalPrice: Number(k.total_price || 0),
        })
      })
    }
  }

  // 3. Check legacy snacks if list is still empty
  if (list.length === 0) {
    if (order.wants_patra && (order.patra_packets || 0) > 0) {
      const qty = Number(order.patra_packets || 0)
      const price = Number(order.patra_price_per_packet || 75)
      list.push({
        id: `snack-patra-${order.id}`,
        productName: "Patra",
        variantName: "Patra Packet",
        categoryName: "Snacks",
        quantity: qty,
        unitType: "PACKET",
        unitPrice: price,
        totalPrice: qty * price,
      })
    }
    if (order.wants_bhakarwadi && (order.bhakarwadi_packets || 0) > 0) {
      const qty = Number(order.bhakarwadi_packets || 0)
      const price = Number(order.bhakarwadi_price_per_packet || 60)
      list.push({
        id: `snack-bhakarwadi-${order.id}`,
        productName: "Bhakarwadi",
        variantName: "Packet",
        categoryName: "Snacks",
        quantity: qty,
        unitType: "PACKET",
        unitPrice: price,
        totalPrice: qty * price,
      })
    }
    if (order.wants_fulvadi && (order.fulvadi_packets || 0) > 0) {
      const qty = Number(order.fulvadi_packets || 0)
      const price = Number(order.fulvadi_price_per_packet || 90)
      list.push({
        id: `snack-fulvadi-${order.id}`,
        productName: "Fulvadi",
        variantName: "Packet",
        categoryName: "Snacks",
        quantity: qty,
        unitType: "PACKET",
        unitPrice: price,
        totalPrice: qty * price,
      })
    }
    if (order.wants_chikki && (order.chikki_packets || 0) > 0) {
      const qty = Number(order.chikki_packets || 0)
      const price = Number(order.chikki_price_per_packet || 31)
      list.push({
        id: `snack-chikki-${order.id}`,
        productName: "Chikki",
        variantName: "Packet",
        categoryName: "Snacks",
        quantity: qty,
        unitType: "PACKET",
        unitPrice: price,
        totalPrice: qty * price,
      })
    }
  }

  return list
}
