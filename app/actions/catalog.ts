"use server"

import { prisma } from "../../lib/prisma"
import { revalidatePath } from "next/cache"

// Categories
export async function getCategories() {
  return prisma.productCategory.findMany({
    orderBy: { displayOrder: "asc" }
  })
}

export async function getFullCatalog() {
  return prisma.productCategory.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
    include: {
      products: {
        where: { isActive: true },
        orderBy: { name: "asc" },
        include: {
          variants: {
            where: { isActive: true },
            orderBy: { name: "asc" },
            include: {
              pricingRules: true,
              product: true
            }
          }
        }
      }
    }
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
  const slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const prod = await prisma.product.create({ data: { ...data, slug } })
  revalidatePath("/products")
  revalidatePath("/catalogue")
  return prod
}

// Create product + variant + pricing in one shot (for the Create Product dialog)
export async function createProductWithVariant(data: {
  name: string
  categoryId: string
  variantName: string
  unitType: "KG" | "PACKET" | "BOX"
  costPrice: number
  minSellingPrice: number
  maxSellingPrice: number
}) {
  const slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now()
  
  const prod = await prisma.product.create({
    data: {
      name: data.name,
      categoryId: data.categoryId,
      slug,
      isActive: true,
      variants: {
        create: {
          name: data.variantName,
          unitType: data.unitType,
          isActive: true,
          inventoryTracked: false,
          pricingRules: {
            create: {
              pricingType: data.unitType === 'KG' ? 'RANGE' : 'FIXED',
              costPrice: data.costPrice,
              minSellingPrice: data.minSellingPrice,
              maxSellingPrice: data.maxSellingPrice,
            }
          }
        }
      }
    },
    include: { variants: { include: { pricingRules: true } } }
  })
  
  revalidatePath("/products")
  revalidatePath("/catalogue")
  revalidatePath("/orders/new")
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

export async function updateVariant(id: string, data: { name: string; sku?: string; weightKg?: number; unitType: any; isActive: boolean; inventoryTracked: boolean }) {
  const v = await prisma.productVariant.update({ where: { id }, data })
  revalidatePath("/products")
  return v
}

export async function updatePricing(variantId: string, data: { costPrice: number; minSellingPrice: number; maxSellingPrice: number }) {
  const existing = await prisma.productPricing.findFirst({ where: { variantId } })
  if (existing) {
    await prisma.productPricing.update({
      where: { id: existing.id },
      data
    })
  } else {
    await prisma.productPricing.create({
      data: {
        variantId,
        ...data,
        pricingType: "FIXED"
      }
    })
  }
  revalidatePath("/products")
  revalidatePath("/orders/new")
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
