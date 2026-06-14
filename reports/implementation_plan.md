# Objective

Refactor the New Order and Edit Order UX to align with the new Prisma Catalog architecture, implement a multi-step dynamic wizard, and clean up legacy customer data.

## User Review Required

> [!IMPORTANT]
> To properly "Merge duplicate customer records" and "Move all order references to the master record", we must add a relational link between `Order` and `Customer`. Currently, the `Order` table stores `shop_name`, `address`, and `city` as isolated strings without a direct foreign key to the `Customer` table.
> **I will add `customerId` to the `Order` table and migrate existing orders to link to their respective customers before proceeding.**

> [!WARNING]
> Duplicate customers with the *same* shop name but *different* cities (e.g., "SURBHI AMRUT DAIRY FARM" in Savarkundla, Bagasara, and Dhari) might actually be different branch locations rather than accidental duplicates. Please review `reports/customer_merge_report.md` closely before approving their merge into a single master record.

## Proposed Changes

### Database & Customer Audit (Phase 1)
- **`prisma/schema.prisma`**: Add `customerId String? @db.Uuid` to `Order` model and a `customer` relation.
- **Migration & Linking**: Run a data migration to link all 637 existing historical orders to their exact `Customer` record using `(shop_name, city)`.
- **Customer Merge Utility**: Create a script `scripts/merge-customers.ts` to safely merge the duplicates identified in the audit into master records and reassign the newly linked `customerId` on their orders.

### UI Overhaul (Phases 2-4)
- **`app/orders/new/page.tsx`**: Replace with a modern 4-step wizard.
  - *Step 1*: Dynamic searchable Customer selector. Includes order history panel and 1-click "Use Previous Order" fast reorder.
  - *Step 2*: Dynamic Catalog selector (Category Chips -> Products -> Variants -> Qty). Live profit/revenue preview based on `ProductPricing`.
  - *Step 3*: Dedicated Review Order screen with validation checks.
  - *Step 4*: Animated Success screen using SVG stroke animation and Lottie confetti.
- **`app/orders/[id]/edit/page.tsx`**: Dedicated Edit Order route built entirely on the new Catalog architecture with an interactive Status timeline and mobile-friendly swipe/tap controls.
- **Legacy Cleanup**: Systematically remove legacy fields and calculations across the codebase.

## Verification Plan

### Automated Tests
- Run `npx tsc --noEmit` and build checks to ensure no type errors remain after removing legacy constants.

### Manual Verification
- Verify the Customer Merge utility correctly updates `customerId` on orders without deleting the orders.
- Verify the New Order Wizard successfully creates a dynamic `Order` and `OrderItem` rows mapped to the Prisma Catalog.
- Ensure the Edit Order page accurately reflects dynamic product data without relying on hardcoded arrays.
