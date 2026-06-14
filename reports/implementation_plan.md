# P0 Critical Bugs & P1 UI Regressions Implementation Plan

## Goal
Halt all feature development to resolve 8 critical release-blocking regressions introduced during the New Order wizard and Edit Order migration.

## User Review Required

> [!IMPORTANT]
> This plan addresses production blockers including empty orders, blank detail pages, broken sidebars, and Prisma serialization crashes. Please review the proposed fixes below and approve before execution.

## Proposed Changes

### P0 Critical Bugs

#### 1. Decimal Serialization Crash
- **Root Cause**: Next.js Server Components cannot pass native Prisma `Decimal` objects (like `total_khakhra_kg`, `total_amount`) to Client Components.
- **Fix**: Create a server-side serialization wrapper in `app/orders/[id]/edit/page.tsx` and `app/orders/[id]/page.tsx` that explicitly converts all `Decimal` values to `Number` before passing them down to client components.

#### 2. New Order Created With ₹0
- **Root Cause**: `createOrder()` does not enforce a minimum cart length or revenue threshold, allowing empty configurations to be written to the DB.
- **Fix**: Update `app/actions/order.ts` to strictly throw an error if `items.length === 0` or `totalAmount <= 0`. Update `step3-review.tsx` to visually block submission under these conditions.

#### 3. View Details Opens Empty Page
- **Root Cause**: The dynamic route `app/orders/[id]/page.tsx` was never created.
- **Fix**: Implement `app/orders/[id]/page.tsx` using `getOrderById()`. If the order is missing, render `notFound()`.

#### 4. Patra Price = NaN
- **Root Cause**: A variant with missing pricing rules throws `NaN` because `Number(undefined)` is evaluated.
- **Fix**: In `step2-products.tsx`, fallback to `0`. Display "Pricing unavailable" and disable the "Add to Order" button if a valid price cannot be derived.

### P1 Architecture Mistakes

#### 5. Cart Sidebar UX Is Broken
- **Root Cause**: The sticky sidebar overflows the container.
- **Fix**: Switch to a unified container. Desktop: 70% Products grid, 30% Order Summary. Tablet: Stacked grid. Mobile: Fixed sticky bottom overlay for cart summary.

#### 6. Replace Existing Flows
- **Fix**: Fully delete `<EditOrderDialog>` from `app/orders/page.tsx`. Ensure all 'Edit' and 'View' buttons natively navigate to `/orders/[id]/edit` and `/orders/[id]`.

#### 7. Step 2 Product Selection UX Is Wrong
- **Fix**: Re-engineer the layout for non-technical users. Employ a vertical drill-down: Category Chips → Filtered Product Cards → Filtered Variant Cards → Quantity Selector → Add to Order. Remove all horizontal scrolling.

#### 8. Success Screen Before Validation
- **Fix**: Ensured by Fix #2. Step 4 will strictly only mount if `createOrder` completes without error.

## Verification Plan

### Automated Tests
- Run `npx tsc --noEmit` to verify type safety after fixing Decimal serialization.

### Manual Verification
- Attempt to create an order with 0 items; verify it is rejected.
- Select Patra and ensure `NaN` does not appear.
- View an order detail page (`/orders/[id]`) and ensure it renders.
