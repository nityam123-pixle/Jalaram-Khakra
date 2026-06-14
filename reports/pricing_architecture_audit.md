# Pricing Architecture Audit

## 1. Actual Prisma Models (from schema.prisma)
```prisma
model Product {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  categoryId String   @db.Uuid
  name       String
  variants   ProductVariant[]
  @@map("products")
}

model ProductVariant {
  id               String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  productId        String   @db.Uuid
  name             String
  pricingRules     ProductPricing[]
  pricingHistory   PricingHistory[]
  @@map("product_variants")
}

model ProductPricing {
  id              String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  variantId       String      @db.Uuid
  pricingType     PricingType @default(FIXED)
  costPrice       Float
  minSellingPrice Float?
  maxSellingPrice Float?
  variant         ProductVariant @relation(fields: [variantId], references: [id])
  @@map("product_pricing")
}

model PricingHistory {
  id              String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  variantId       String      @db.Uuid
  pricingType     PricingType
  costPrice       Float
  minSellingPrice Float?
  maxSellingPrice Float?
  variant         ProductVariant @relation(fields: [variantId], references: [id])
  @@map("pricing_history")
}
```

## 2. Exact Query by Step2Products
`Step2Products` does not execute a Prisma query itself. It receives `catalogData` as a prop from `app/orders/new/page.tsx`, which calls the Server Action `getFullCatalog()` inside `app/actions/catalog.ts`.

```typescript
// app/actions/catalog.ts
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
              pricingRules: true
            }
          }
        }
      }
    }
  })
}
```

## 3. Exact TypeScript Types
In `Step2Products` (`components/order-wizard/step2-products.tsx`):
```typescript
const activeVariant = activeProduct?.variants.find((v: any) => v.id === selectedVariantId)
const pricingRule = activeVariant?.pricingRules?.[0]
```
The types are effectively `any` at runtime, but structurally:
`activeVariant` is `{ id: string, name: string, pricingRules: ProductPricing[] }`
`pricingRule` is `{ costPrice: number | Decimal, minSellingPrice: number | Decimal }`

## 4. Codebase Search Results
- `grep -R "pricingRules"`: Found in `schema.prisma` as the relation name `pricingRules ProductPricing[]` on `ProductVariant`. Used in `app/actions/catalog.ts` in the `include: { pricingRules: true }` statement. Used in `Step2Products` to extract `activeVariant?.pricingRules?.[0]`.
- `grep -R "ProductPricing"`: Found in `schema.prisma`.
- `grep -R "PricingHistory"`: Found in `schema.prisma`.

## 5. Identifying Step2Products Reading Target
`Step2Products` is explicitly reading `variant.pricingRules` (the Prisma relation name), which maps to the `product_pricing` table in Postgres due to the `@@map("product_pricing")` directive on the `ProductPricing` model.

## 6. Patra Variant Source (REAL schema vs ERROR)
The database error `ERROR: relation "pricing_rules" does not exist` is occurring because the Next.js process has an **outdated generated Prisma Client**.
When `include: { pricingRules: true }` is executed, Prisma converts this to SQL. If an older version of the schema had `@@map("pricing_rules")` instead of `@@map("product_pricing")`, the generated SQL will query the literal table name `"pricing_rules"`.
Because the live Postgres database has `"product_pricing"` (created by the migration), Postgres throws the error.
The root cause of BOTH the "Patra Pricing Failure" AND the "Edit Order Broken" (`include: { customer: true }`) is identical: The Next.js dev server has cached a stale `@prisma/client` binding.
