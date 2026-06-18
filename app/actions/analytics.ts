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

export async function getMonthlyOrdersByCustomer(year: number, month: number) {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

  const customers = await prisma.customer.findMany({
    where: {
      orders: {
        some: {
          created_at: {
            gte: startDate,
            lte: endDate
          }
        }
      }
    },
    include: {
      orders: {
        where: {
          created_at: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { created_at: 'asc' },
        include: { invoice: true }
      }
    },
    orderBy: { shop_name: 'asc' }
  });

  const formatted = customers.map(c => {
    const totalAmount = c.orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    return {
      id: c.id,
      shop_name: c.shop_name,
      city: c.city,
      orders: c.orders,
      totalAmount
    };
  });

  return serializePrisma(formatted);
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

export async function getExecutiveSummary() {
  const [
    totalOrders,
    revenueResult,
    profitResult,
    citiesQuery,
    customerOrderGroups,
    categoryStats,
    monthlyGroups
  ] = await Promise.all([
    prisma.order.count(),
    prisma.orderItem.aggregate({ _sum: { totalRevenue: true, quantity: true } }),
    prisma.orderItem.aggregate({ _sum: { totalProfit: true } }),
    prisma.order.findMany({ select: { city: true }, distinct: ['city'] }),
    prisma.order.groupBy({ by: ['customerId'], _count: { id: true } }),
    prisma.orderItem.groupBy({
      by: ['categoryName'],
      _sum: { totalRevenue: true, totalProfit: true, quantity: true },
    }),
    prisma.order.groupBy({
      by: ['created_at'],
      _sum: { total_amount: true },
      _count: { id: true }
    })
  ]);

  const totalRevenue = revenueResult._sum.totalRevenue || 0;
  const totalProfit = profitResult._sum.totalProfit || 0;
  const totalQuantity = revenueResult._sum.quantity || 0;

  // Process monthly data (grouping by month in JS since Prisma groupBy month is DB-specific)
  const monthlyMap = new Map<string, { monthKey: string, month: string, revenue: number, profit: number, orders: number }>();
  
  // Note: For large DBs, doing month aggregation in DB is better, but this works for now.
  // Instead of querying all orders, we can just aggregate from order items and orders
  
  const allOrders = await prisma.order.findMany({
    select: { created_at: true, total_amount: true, id: true },
    orderBy: { created_at: 'asc' }
  });

  allOrders.forEach(o => {
    if (!o.created_at) return;
    const date = new Date(o.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = date.toLocaleString('default', { month: 'short', year: 'numeric' });

    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, { monthKey, month: monthLabel, revenue: 0, profit: 0, orders: 0 });
    }
    const stat = monthlyMap.get(monthKey)!;
    stat.revenue += Number(o.total_amount || 0);
    stat.orders += 1;
  });

  // To get profit per month easily without a huge join, we can do a similar pass on order items
  const allItems = await prisma.orderItem.findMany({
    select: { createdAt: true, totalProfit: true }
  });

  allItems.forEach(i => {
    const date = new Date(i.createdAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (monthlyMap.has(monthKey)) {
      monthlyMap.get(monthKey)!.profit += i.totalProfit;
    }
  });

  const monthlyPerformance = Array.from(monthlyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(entry => entry[1])
    .slice(-12); // last 12 months

  return {
    kpis: {
      totalOrders,
      totalRevenue,
      totalProfit,
      aov: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      productsSold: totalQuantity,
      activeCustomers: customerOrderGroups.length,
      profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
      citiesServed: citiesQuery.length
    },
    categoryStats: categoryStats.map(c => ({
      category: c.categoryName,
      revenue: c._sum.totalRevenue || 0,
      profit: c._sum.totalProfit || 0,
      units: c._sum.quantity || 0,
      margin: (c._sum.totalRevenue || 0) > 0 ? ((c._sum.totalProfit || 0) / (c._sum.totalRevenue || 0)) * 100 : 0
    })).sort((a,b) => b.revenue - a.revenue),
    monthlyPerformance
  };
}

export async function getCustomerIntelligence() {
  const topCustomersByRevenue = await prisma.customer.findMany({
    take: 10,
    include: {
      orders: {
        select: { total_amount: true }
      }
    }
  });

  const processed = topCustomersByRevenue.map(c => {
    const rev = c.orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    return {
      id: c.id,
      name: c.shop_name,
      city: c.city,
      totalOrders: c.totalOrders || c.orders.length,
      lifetimeRevenue: rev
    };
  }).sort((a,b) => b.lifetimeRevenue - a.lifetimeRevenue);

  return serializePrisma({
    topSpenders: processed.slice(0, 5),
    mostFrequent: [...processed].sort((a,b) => b.totalOrders - a.totalOrders).slice(0, 5)
  });
}

