"use server"

import { prisma } from "../../lib/prisma"
import { serializePrisma } from "../../lib/prisma-serializer"

export async function getDashboardAnalytics() {
  const [totalOrders, pendingOrders, completedOrders] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "pending" } }),
    prisma.order.count({ where: { status: "completed" } })
  ])

  // Get overall totals from Order level (assuming total_amount matches sum of items)
  // Or we can just sum up the order_items
  const metrics = await prisma.orderItem.aggregate({
    _sum: {
      totalRevenue: true,
      totalProfit: true,
      quantity: true
    }
  })

  const totalEarnings = metrics._sum.totalRevenue || 0
  const totalProfit = metrics._sum.totalProfit || 0

  // Profit and Quantity grouped by Category
  const byCategory = await prisma.orderItem.groupBy({
    by: ['categoryName'],
    _sum: {
      totalProfit: true,
      quantity: true
    },
    orderBy: {
      _sum: {
        totalProfit: 'desc'
      }
    }
  })

  // Format by Category into a friendly array
  const profitByCategory = byCategory.map(c => ({
    label: c.categoryName,
    profit: c._sum.totalProfit || 0,
    quantity: c._sum.quantity || 0
  }))

  return {
    totalOrders,
    pendingOrders,
    completedOrders,
    totalEarnings,
    totalProfit,
    profitByCategory
  }
}

export async function getOrdersForChart() {
  // To keep compatibility with the existing chart, we might just return the raw items
  // or a grouped timeline. The existing chart expects `orders` array and iterates them.
  // We will pre-aggregate the daily revenue/profit to make the chart rendering lightning fast.
  
  // Since Prisma doesn't support grouping by raw DATE easily across all DBs, we can just 
  // fetch order items with their created_at and do a quick grouping in JS which is very fast.
  const items = await prisma.orderItem.findMany({
    select: {
      createdAt: true,
      totalRevenue: true,
      totalProfit: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  })

  return serializePrisma(items)
}

export async function getRecentOrders(take = 8) {
  const orders = await prisma.order.findMany({
    take,
    orderBy: { created_at: 'desc' },
    include: {
      items: {
        select: { totalRevenue: true, totalProfit: true, productName: true, categoryName: true }
      }
    }
  })
  return serializePrisma(orders)
}

export async function getSummaryOrders() {
  const orders = await prisma.order.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      items: true
    }
  })
  return serializePrisma(orders)
}

export async function getDashboardData() {
  const [orders, catalog, customers] = await Promise.all([
    prisma.order.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        customer: true,
        items: true
      }
    }),
    prisma.productCategory.findMany({
      include: {
        products: {
          include: {
            variants: {
              include: {
                pricingRules: true
              }
            }
          }
        }
      }
    }),
    prisma.customer.findMany({
      where: { isArchived: false }
    })
  ])

  return serializePrisma({
    orders,
    catalog,
    customers
  })
}

