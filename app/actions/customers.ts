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
