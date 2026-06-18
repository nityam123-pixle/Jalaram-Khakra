"use server"

import { prisma } from "../../lib/prisma"
import { serializePrisma } from "../../lib/prisma-serializer"

export async function searchCustomers(query: string) {
  const q = query.trim()
  if (!q) {
    const customers = await prisma.customer.findMany({
      where: { isArchived: false },
      orderBy: { lastOrderAt: 'desc' },
      include: {
        _count: {
          select: { orders: true }
        }
      },
      take: 20
    })
    return serializePrisma(customers)
  }

  // Very basic search, assuming PostgreSQL ilike or Prisma contains
  const customers = await prisma.customer.findMany({
    where: {
      isArchived: false,
      OR: [
        { shop_name: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { address: { contains: q, mode: 'insensitive' } }
      ]
    },
    orderBy: { lastOrderAt: 'desc' },
    include: {
      _count: {
        select: { orders: true }
      }
    },
    take: 20
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

    c.orders.forEach(o => {
      lifetimeRevenue += Number(o.total_amount || 0);
      o.items.forEach(i => {
        lifetimeProfit += i.totalProfit;
      });
      if (o.created_at) {
        if (!lastOrderDate || new Date(o.created_at) > lastOrderDate) {
          lastOrderDate = new Date(o.created_at);
        }
      }
    });

    let status = "Active";
    if (!lastOrderDate) {
      status = "New";
    } else {
      const daysSinceLastOrder = (new Date().getTime() - lastOrderDate.getTime()) / (1000 * 3600 * 24);
      if (daysSinceLastOrder > 60) status = "Dormant";
      if (lifetimeRevenue > 50000 && status !== "Dormant") status = "High Value";
    }

    return {
      id: c.id,
      shop_name: c.shop_name,
      city: c.city,
      phone: c.phone,
      totalOrders: c.orders.length,
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
