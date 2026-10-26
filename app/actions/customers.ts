"use server"

import { prisma } from "../../lib/prisma"
import { serializePrisma } from "../../lib/prisma-serializer"

export async function getAllCustomersForSelect() {
  const customers = await prisma.customer.findMany({
    where: { isArchived: false },
    orderBy: [
      { lastOrderAt: 'desc' },
      { shop_name: 'asc' }
    ],
    include: {
      _count: {
        select: { orders: true }
      }
    }
  })
  return serializePrisma(customers)
}

export async function searchCustomers(query: string) {
  const q = query.trim()
  if (!q) {
    return getAllCustomersForSelect()
  }

  const tokens = q.split(/\s+/).filter(Boolean)
  const whereConditions = tokens.map(t => ({
    OR: [
      { shop_name: { contains: t, mode: 'insensitive' as const } },
      { city: { contains: t, mode: 'insensitive' as const } },
      { phone: { contains: t, mode: 'insensitive' as const } },
      { address: { contains: t, mode: 'insensitive' as const } }
    ]
  }))

  const customers = await prisma.customer.findMany({
    where: {
      isArchived: false,
      AND: whereConditions
    },
    orderBy: { lastOrderAt: 'desc' },
    include: {
      _count: {
        select: { orders: true }
      }
    },
    take: 100
  })
  return serializePrisma(customers)
}

export async function getCustomerHistory(customerId: string) {
  const history = await prisma.order.findMany({
    where: { customerId },
    orderBy: { created_at: 'desc' },
    take: 5,
    include: {
      items: true
    }
  })
  return serializePrisma(history)
}

export async function checkDuplicateCustomer(shopName: string, city: string) {
  return prisma.customer.findFirst({
    where: {
      isArchived: false,
      shop_name: { equals: shopName, mode: 'insensitive' },
      city: { equals: city, mode: 'insensitive' }
    }
  })
}

export async function createCustomer(data: {
  shop_name: string
  city: string
  phone?: string
  address?: string
}) {
  const existing = await checkDuplicateCustomer(data.shop_name, data.city)
  if (existing) {
    throw new Error("Customer already exists")
  }
  return prisma.customer.create({ data })
}

export async function getCRMCustomers() {
  const customers = await prisma.customer.findMany({
    where: { isArchived: false },
    include: {
      orders: {
        select: {
          total_amount: true,
          created_at: true,
          items: {
            select: { totalProfit: true }
          }
        }
      }
    },
    orderBy: { shop_name: 'asc' }
  });

  const processed = customers.map(c => {
    let lifetimeRevenue = 0;
    let lifetimeProfit = 0;
    let lastOrderDate: Date | null = null;

    const orders = c.orders || [];
    orders.forEach(o => {
      lifetimeRevenue += Number(o.total_amount || 0);
      const items = o.items || [];
      items.forEach(i => {
        lifetimeProfit += Number(i.totalProfit || 0);
      });
      if (o.created_at) {
        const orderDate = new Date(o.created_at);
        if (!lastOrderDate || orderDate > lastOrderDate) {
          lastOrderDate = orderDate;
        }
      }
    });

    let status = "Active";
    if (!lastOrderDate) {
      status = "New";
    } else {
      const lastTime = new Date(lastOrderDate).getTime();
      const daysSinceLastOrder = (Date.now() - lastTime) / (1000 * 3600 * 24);
      if (daysSinceLastOrder > 60) status = "Dormant";
      if (lifetimeRevenue > 50000 && status !== "Dormant") status = "High Value";
    }

    return {
      id: c.id,
      shop_name: c.shop_name || "Unknown Shop",
      city: c.city || "",
      phone: c.phone || "",
      address: c.address || "",
      totalOrders: orders.length,
      lifetimeRevenue,
      lifetimeProfit,
      lastOrderDate,
      createdAt: c.created_at,
      status
    };
  });

  return serializePrisma(processed);
}

export async function getCustomerStats() {
  const customers = await getCRMCustomers();
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c: any) => c.totalOrders > 0).length;
  const repeatCustomers = customers.filter((c: any) => c.totalOrders > 1).length;
  const activePct = totalCustomers > 0 ? (activeCustomers / totalCustomers) * 100 : 0;
  const repeatPct = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

  const cityCounts: Record<string, number> = {};
  customers.forEach((c: any) => {
    const city = c.city?.trim();
    if (city) cityCounts[city] = (cityCounts[city] || 0) + 1;
  });
  const topCity = Object.entries(cityCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";

  const sortedByRev = [...customers].sort((a: any, b: any) => b.lifetimeRevenue - a.lifetimeRevenue);
  const topCustomer = sortedByRev[0]?.shop_name || "None";

  const totalRev = customers.reduce((s: number, c: any) => s + c.lifetimeRevenue, 0);
  const totalOrders = customers.reduce((s: number, c: any) => s + c.totalOrders, 0);
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRev / totalOrders) : 0;

  const now = new Date();
  const customersThisMonth = customers.filter((c: any) => {
    if (!c.lastOrderDate) return false;
    const d = new Date(c.lastOrderDate);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const newCustomers = customers.filter((c: any) => c.status === "New" || c.totalOrders === 0).length;

  return {
    totalCustomers,
    activeCustomers,
    activePct,
    repeatCustomers,
    repeatPct,
    topCity,
    topCustomer,
    avgOrderValue,
    customersThisMonth,
    newCustomers,
  };
}

export async function updateCustomer(id: string, data: {
  shop_name: string
  city: string
  phone?: string
  address?: string
}) {
  const updated = await prisma.customer.update({
    where: { id },
    data: {
      shop_name: data.shop_name.trim(),
      city: data.city.trim(),
      phone: data.phone?.trim() || null,
      address: data.address?.trim() || null,
    }
  });
  return serializePrisma(updated);
}

export async function deleteCustomer(id: string) {
  const deleted = await prisma.customer.update({
    where: { id },
    data: { isArchived: true }
  });
  return serializePrisma(deleted);
}

export async function bulkDeleteCustomers(ids: string[]) {
  const deleted = await prisma.customer.updateMany({
    where: { id: { in: ids } },
    data: { isArchived: true }
  });
  return serializePrisma(deleted);
}

export async function getCustomerDetails(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      orders: {
        orderBy: { created_at: 'desc' },
        take: 10,
        include: {
          items: true
        }
      },
      invoices: {
        orderBy: { invoiceDate: 'desc' }
      }
    }
  });

  return serializePrisma(customer);
}
