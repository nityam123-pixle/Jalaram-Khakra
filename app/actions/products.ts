"use server"

import { prisma } from "@/lib/prisma"
import { serializePrisma } from "@/lib/prisma-serializer"
import { revalidatePath } from "next/cache"

export interface VariantWorkspaceItem {
  id: string
  name: string
  sku: string | null
  weightKg: number | null
  unitType: "KG" | "PACKET" | "BOX"
  isActive: boolean
  inventoryTracked: boolean
  createdAt: string
  updatedAt: string
  productId: string
  product: {
    id: string
    name: string
    slug: string
    categoryId: string
    category: {
      id: string
      name: string
      slug: string
      displayOrder?: number
    }
  }
  pricing: {
    costPrice: number
    minSellingPrice: number
    maxSellingPrice: number
    pricingType: "FIXED" | "RANGE" | "MRP"
    effectiveFrom: string
  } | null
  inventory: {
    availableStock: number
    reservedStock: number
    reorderPoint: number
  } | null
  pricingHistory: Array<{
    id: string
    pricingType: string
    costPrice: number
    minSellingPrice: number | null
    maxSellingPrice: number | null
    effectiveFrom: string
    correctionReason: string | null
  }>
  // Derived computed metrics
  packSize: string
  profitMin: number
  profitMax: number
  marginMin: number
  marginMax: number
  healthStatus: "Good" | "Low" | "Issue"
}

export interface ProductsWorkspaceData {
  categories: Array<{
    id: string
    name: string
    slug: string
    productCount: number
    variantCount: number
  }>
  variants: VariantWorkspaceItem[]
  stats: {
    totalProducts: number
    totalVariants: number
    totalCategories: number
    healthCounts: {
      good: number
      low: number
      issues: number
    }
  }
}

function cleanPackSize(variantName: string, unitType: string, weightKg: number | null): string {
  const vLower = variantName.toLowerCase().trim()
  if (vLower.includes("200g") || vLower.includes("200 gm") || vLower.includes("200gm")) return "200g"
  if (vLower.includes("500g") || vLower.includes("500 gm") || vLower.includes("500gm")) return "500g"
  if (vLower.includes("250g") || vLower.includes("250 gm") || vLower.includes("250gm")) return "250g"
  if (vLower.includes("1kg") || vLower.includes("1 kg")) return "1kg"
  if (vLower.includes("packet") || vLower.includes("pkt")) return "1 pkt"
  if (weightKg && weightKg > 0) {
    if (weightKg < 1) return `${Math.round(weightKg * 1000)}g`
    return `${weightKg}kg`
  }
  if (unitType === "KG") return "1kg"
  if (unitType === "PACKET") return "1 pkt"
  if (unitType === "BOX") return "1 box"
  return variantName || "1 unit"
}

export async function getProductsWorkspaceData(): Promise<ProductsWorkspaceData> {
  // Fetch active categories with product counts (excluding internal System Operations)
  const categoriesRaw = await prisma.productCategory.findMany({
    where: {
      isActive: true,
      name: { not: "System Operations" }
    },
    orderBy: { displayOrder: "asc" },
    include: {
      products: {
        where: { isActive: true },
        include: {
          variants: {
            where: { isActive: true }
          }
        }
      }
    }
  })

  // Fetch all active variants for active products
  const variantsRaw = await prisma.productVariant.findMany({
    where: {
      isActive: true,
      product: {
        isActive: true,
        category: {
          isActive: true,
          name: { not: "System Operations" }
        }
      }
    },
    include: {
      product: {
        include: {
          category: true
        }
      },
      pricingRules: {
        orderBy: { createdAt: "desc" },
        take: 1
      },
      pricingHistory: {
        orderBy: { createdAt: "desc" },
        take: 15
      },
      inventory: true
    },
    orderBy: [
      { product: { category: { displayOrder: "asc" } } },
      { product: { name: "asc" } },
      { name: "desc" }
    ]
  })

  let goodCount = 0
  let lowCount = 0
  let issuesCount = 0

  const processedVariants: VariantWorkspaceItem[] = variantsRaw.map((v) => {
    const rule = v.pricingRules?.[0]
    const hasPricing = Boolean(rule && rule.costPrice != null && Number(rule.costPrice) > 0 && (rule.minSellingPrice != null || rule.maxSellingPrice != null))

    const costPrice = hasPricing ? Number(rule!.costPrice) : 0
    const minSellingPrice = hasPricing ? Number(rule!.minSellingPrice ?? costPrice) : 0
    const maxSellingPrice = hasPricing ? Number(rule!.maxSellingPrice ?? minSellingPrice) : minSellingPrice

    // Precision-safe profit rounding (2 decimal places)
    const profitMin = Math.round((minSellingPrice - costPrice + Number.EPSILON) * 100) / 100
    const profitMax = Math.round((maxSellingPrice - costPrice + Number.EPSILON) * 100) / 100

    // Margin = (profit / sellingPrice) * 100
    const marginMin = minSellingPrice > 0 ? Math.round((((minSellingPrice - costPrice) / minSellingPrice) * 100) * 10) / 10 : 0
    const marginMax = maxSellingPrice > 0 ? Math.round((((maxSellingPrice - costPrice) / maxSellingPrice) * 100) * 10) / 10 : 0

    let healthStatus: "Good" | "Low" | "Issue" = "Good"
    if (!hasPricing || minSellingPrice <= 0 || costPrice <= 0 || profitMin < 0 || profitMax < 0 || marginMax < 5) {
      healthStatus = "Issue"
      issuesCount++
    } else if (marginMax >= 20) {
      healthStatus = "Good"
      goodCount++
    } else {
      healthStatus = "Low"
      lowCount++
    }

    return {
      id: v.id,
      name: v.name,
      sku: v.sku,
      weightKg: v.weightKg,
      unitType: v.unitType,
      isActive: v.isActive,
      inventoryTracked: v.inventoryTracked,
      createdAt: v.createdAt.toISOString(),
      updatedAt: v.updatedAt.toISOString(),
      productId: v.productId,
      product: {
        id: v.product.id,
        name: v.product.name,
        slug: v.product.slug,
        categoryId: v.product.categoryId,
        category: {
          id: v.product.category.id,
          name: v.product.category.name,
          slug: v.product.category.slug,
          displayOrder: v.product.category.displayOrder,
        }
      },
      pricing: rule ? {
        costPrice,
        minSellingPrice,
        maxSellingPrice,
        pricingType: rule.pricingType,
        effectiveFrom: rule.effectiveFrom.toISOString(),
      } : null,
      inventory: v.inventory ? {
        availableStock: v.inventory.availableStock,
        reservedStock: v.inventory.reservedStock,
        reorderPoint: v.inventory.reorderPoint,
      } : null,
      pricingHistory: (v.pricingHistory || []).map((h) => ({
        id: h.id,
        pricingType: h.pricingType,
        costPrice: h.costPrice,
        minSellingPrice: h.minSellingPrice,
        maxSellingPrice: h.maxSellingPrice,
        effectiveFrom: h.effectiveFrom.toISOString(),
        correctionReason: h.correctionReason,
      })),
      packSize: cleanPackSize(v.name, v.unitType, v.weightKg),
      profitMin,
      profitMax,
      marginMin,
      marginMax,
      healthStatus,
    }
  })

  // Calculate distinct product counts per category
  const categories = categoriesRaw.map((cat) => {
    const activeProducts = cat.products.filter((p) => p.isActive)
    const variantCount = activeProducts.reduce((sum, p) => sum + p.variants.filter((v) => v.isActive).length, 0)
    return {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      productCount: activeProducts.length,
      variantCount,
    }
  }).filter((c) => c.productCount > 0)

  const distinctProductIds = new Set(processedVariants.map((v) => v.productId))

  return serializePrisma({
    categories,
    variants: processedVariants,
    stats: {
      totalProducts: distinctProductIds.size,
      totalVariants: processedVariants.length,
      totalCategories: categories.length,
      healthCounts: {
        good: goodCount,
        low: lowCount,
        issues: issuesCount,
      }
    }
  })
}

// Update variant details
export async function updateProductVariantDetails(
  variantId: string,
  data: {
    productName: string
    categoryId: string
    variantName: string
    packSize?: string
    unitType: "KG" | "PACKET" | "BOX"
    sku?: string | null
    weightKg?: number | null
  }
) {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: true }
  })
  if (!variant) throw new Error("Variant not found")

  await prisma.$transaction([
    // Update product name & category if changed
    prisma.product.update({
      where: { id: variant.productId },
      data: {
        name: data.productName,
        categoryId: data.categoryId,
      }
    }),
    // Update variant fields
    prisma.productVariant.update({
      where: { id: variantId },
      data: {
        name: data.variantName,
        sku: data.sku || null,
        unitType: data.unitType,
        weightKg: data.weightKg ?? null,
      }
    })
  ])

  revalidatePath("/products")
  revalidatePath("/catalogue")
  return { success: true }
}

// Update variant pricing and add history
export async function updateProductVariantPricing(
  variantId: string,
  data: {
    costPrice: number
    minSellingPrice: number
    maxSellingPrice: number
    pricingType?: "FIXED" | "RANGE" | "MRP"
    reason?: string
  }
) {
  const existingPricing = await prisma.productPricing.findFirst({
    where: { variantId },
    orderBy: { createdAt: "desc" }
  })

  await prisma.$transaction(async (tx) => {
    // 1. Record history if existing pricing exists
    if (existingPricing) {
      await tx.pricingHistory.create({
        data: {
          variantId,
          pricingType: existingPricing.pricingType,
          costPrice: existingPricing.costPrice,
          minSellingPrice: existingPricing.minSellingPrice,
          maxSellingPrice: existingPricing.maxSellingPrice,
          effectiveFrom: existingPricing.effectiveFrom,
          effectiveTo: new Date(),
          correctionReason: data.reason || "Manual price update from Products workspace",
        }
      })
    }

    // 2. Update or create pricing rule
    if (existingPricing) {
      await tx.productPricing.update({
        where: { id: existingPricing.id },
        data: {
          costPrice: data.costPrice,
          minSellingPrice: data.minSellingPrice,
          maxSellingPrice: data.maxSellingPrice,
          pricingType: data.pricingType || (data.minSellingPrice === data.maxSellingPrice ? "FIXED" : "RANGE"),
          effectiveFrom: new Date(),
        }
      })
    } else {
      await tx.productPricing.create({
        data: {
          variantId,
          costPrice: data.costPrice,
          minSellingPrice: data.minSellingPrice,
          maxSellingPrice: data.maxSellingPrice,
          pricingType: data.pricingType || (data.minSellingPrice === data.maxSellingPrice ? "FIXED" : "RANGE"),
          effectiveFrom: new Date(),
        }
      })
    }
  })

  revalidatePath("/products")
  revalidatePath("/catalogue")
  revalidatePath("/orders/new")
  return { success: true }
}

// Update inventory levels for a variant
export async function updateProductVariantInventory(
  variantId: string,
  data: {
    availableStock: number
    reorderPoint: number
    inventoryTracked?: boolean
  }
) {
  await prisma.$transaction([
    prisma.inventoryLevel.upsert({
      where: { variantId },
      update: {
        availableStock: data.availableStock,
        reorderPoint: data.reorderPoint,
      },
      create: {
        variantId,
        availableStock: data.availableStock,
        reorderPoint: data.reorderPoint,
      }
    }),
    prisma.productVariant.update({
      where: { id: variantId },
      data: {
        inventoryTracked: data.inventoryTracked ?? true
      }
    })
  ])

  revalidatePath("/products")
  revalidatePath("/inventory")
  revalidatePath("/current-stock")
  return { success: true }
}

// Delete variant safely
export async function deleteProductVariant(variantId: string) {
  // Check if variant is used in any orders
  const orderItemsCount = await prisma.orderItem.count({
    where: { variantId }
  })

  if (orderItemsCount > 0) {
    // If it has historical order data, soft-delete it by setting isActive: false
    await prisma.productVariant.update({
      where: { id: variantId },
      data: { isActive: false }
    })
  } else {
    // If no order relations, delete pricing and variant
    await prisma.$transaction([
      prisma.pricingHistory.deleteMany({ where: { variantId } }),
      prisma.productPricing.deleteMany({ where: { variantId } }),
      prisma.inventoryLevel.deleteMany({ where: { variantId } }),
      prisma.productVariant.delete({ where: { id: variantId } }),
    ])
  }

  revalidatePath("/products")
  revalidatePath("/catalogue")
  return { success: true }
}

// Create new product + variant + pricing in one shot
export async function createNewProductWithVariant(data: {
  productName: string
  categoryId: string
  variantName: string
  sku?: string
  unitType: "KG" | "PACKET" | "BOX"
  costPrice: number
  minSellingPrice: number
  maxSellingPrice: number
  initialStock?: number
  reorderPoint?: number
}) {
  const slug = data.productName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now()

  const product = await prisma.$transaction(async (tx) => {
    const prod = await tx.product.create({
      data: {
        name: data.productName,
        categoryId: data.categoryId,
        slug,
        isActive: true,
      }
    })

    const variant = await tx.productVariant.create({
      data: {
        productId: prod.id,
        name: data.variantName,
        sku: data.sku || null,
        unitType: data.unitType,
        isActive: true,
        inventoryTracked: Boolean(data.initialStock && data.initialStock > 0),
        pricingRules: {
          create: {
            costPrice: data.costPrice,
            minSellingPrice: data.minSellingPrice,
            maxSellingPrice: data.maxSellingPrice,
            pricingType: data.minSellingPrice === data.maxSellingPrice ? "FIXED" : "RANGE",
          }
        },
        inventory: data.initialStock ? {
          create: {
            availableStock: data.initialStock,
            reorderPoint: data.reorderPoint || 10,
          }
        } : undefined
      },
      include: {
        product: { include: { category: true } },
        pricingRules: true,
        inventory: true
      }
    })

    return { product: prod, variant }
  })

  revalidatePath("/products")
  revalidatePath("/catalogue")
  revalidatePath("/orders/new")

  return serializePrisma(product)
}
