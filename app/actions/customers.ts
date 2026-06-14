"use server"

import { prisma } from "../../lib/prisma"
import { serializePrisma } from "../../lib/prisma-serializer"

export async function searchCustomers(query: string) {
  const q = query.trim()
  if (!q) {
    const customers = await prisma.customer.findMany({
      where: { isArchived: false },
      orderBy: { lastOrderAt: 'desc' },
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
