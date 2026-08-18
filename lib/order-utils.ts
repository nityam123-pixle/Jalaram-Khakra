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

  // If order items exist and their revenue matches or exceeds order.total_amount, trust items
  if (items.length > 0 && itemsRevenue > 0 && (orderTotalAmount === 0 || Math.abs(itemsRevenue - orderTotalAmount) < 1)) {
    totalRevenue = itemsRevenue
    totalCost = itemsCost
    totalProfit = itemsProfit
  } else if (orderTotalAmount > 0) {
    // If order.total_amount is higher or items is empty, use total_amount
    totalRevenue = Math.max(orderTotalAmount, itemsRevenue)
    const legacy = calculateOrderProfit(order)
    totalProfit = Math.max(itemsProfit, legacy.totalProfit || 0)
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
