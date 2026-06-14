"use server"

import { PrismaClient } from "@prisma/client"
import { revalidatePath } from "next/cache"

const prisma = new PrismaClient()

// Categories
export async function getCategories() {
  return prisma.productCategory.findMany({
    orderBy: { displayOrder: "asc" }
  })
}

export async function createCategory(data: { name: string; displayOrder: number; isActive: boolean }) {
  const cat = await prisma.productCategory.create({ data })
  revalidatePath("/products")
  return cat
}

// Products
export async function getProducts(categoryId?: string) {
  return prisma.product.findMany({
    where: categoryId ? { categoryId } : undefined,
    include: {
      category: true,
      variants: {
        include: {
          pricingRules: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  })
}

export async function createProduct(data: { name: string; categoryId: string; isActive: boolean }) {
  const prod = await prisma.product.create({ data })
  revalidatePath("/products")
  return prod
}

// Variants
export async function getVariants(productId?: string) {
  return prisma.productVariant.findMany({
    where: productId ? { productId } : undefined,
    include: {
      pricingRules: true
    }
  })
}

export async function createVariant(data: {
  productId: string
  name: string
  weightKg?: number
  unitType: "KG" | "PACKET" | "BOX"
  isActive: boolean
  inventoryTracked: boolean
  currentStock: number
}) {
  const variant = await prisma.productVariant.create({ data })
  revalidatePath("/products")
  return variant
}

// Pricing Rules
export async function createPricingRule(data: {
  variantId: string
  pricingType: "FIXED" | "RANGE" | "MRP"
  costPrice: number
  minSellingPrice?: number
  maxSellingPrice?: number
}) {
  const rule = await prisma.productPricing.create({ data })
  
  // Also create history record
  await prisma.pricingHistory.create({
    data: {
      variantId: data.variantId,
      pricingType: data.pricingType,
      costPrice: data.costPrice,
      minSellingPrice: data.minSellingPrice,
      maxSellingPrice: data.maxSellingPrice,
      effectiveFrom: new Date()
    }
  })

  revalidatePath("/products")
  return rule
}
