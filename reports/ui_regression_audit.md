# UI Regression Audit & Fix Plan

## 1. Prisma Decimal Serialization Crash
**Root Cause**: Prisma `Decimal` types (like `total_khakhra_kg`, `total_amount`) are returned natively by Prisma queries. When Next.js passes these from a Server Component (`app/orders/[id]/edit/page.tsx`) to a Client Component (`edit-client.tsx`), it fails because React cannot serialize `Decimal` objects.
**Affected Files**: `app/orders/[id]/edit/page.tsx`, `app/actions/order.ts`, `app/orders/page.tsx`
**Fix**: Introduce a serialization utility or explicitly map `Number()` over all Decimal fields in Server Components before passing data to Client Components.

## 2. New Order Created With ₹0
**Root Cause**: The wizard (`step2-products.tsx` & `step3-review.tsx`) allows moving to Success state if the cart is empty or revenue is `0`, and the `createOrder` Server Action does not explicitly enforce a positive revenue/item constraint.
**Affected Files**: `app/actions/order.ts`, `components/order-wizard/step3-review.tsx`
**Fix**: 
- Update `createOrder` to throw an error if `totalAmount <= 0`.
- Update `Step3Review` to disable the "Submit" button if `items.length === 0` or `totalRevenue <= 0` and display "At least one valid item is required".

## 3. View Details Opens Empty Page
**Root Cause**: The dynamic route `app/orders/[id]/page.tsx` was never created during the refactor. The UI assumes it exists (e.g. "View Details" button in Success step).
**Affected Files**: `app/orders/[id]/page.tsx` (missing)
**Fix**: Create `app/orders/[id]/page.tsx` to render the read-only order details page. It will fetch the order and call `notFound()` if it doesn't exist to prevent blank screens.

## 4. Patra Price = NaN
**Root Cause**: If a variant lacks pricing rules (e.g., `pricingRules` array is empty or `minSellingPrice`/`costPrice` are null), the `Number(undefined)` or `Number(null)` conversion results in `NaN`.
**Affected Files**: `components/order-wizard/step2-products.tsx`
**Fix**: Update `handleSelectVariant` and rendering logic to fallback to `0`. If price is `0`, display "Pricing unavailable" and explicitly disable the "Add To Cart" button.

## 5. Cart Sidebar UX Is Broken
**Root Cause**: The cart sidebar used `h-[calc(100vh-200px)] sticky top-6`, which breaks out of its container and causes scrolling issues on smaller screens. 
**Affected Files**: `components/order-wizard/step2-products.tsx`
**Fix**: Remove the sticky positioning for desktop, relying on a clean grid layout (70% Products, 30% Cart). On tablet, stack them vertically. On mobile, implement a sticky bottom action bar that summarizes the cart.

## 6. Disconnected New/Edit Flows
**Root Cause**: The legacy `<EditOrderDialog>` is still mounted in `app/orders/page.tsx`.
**Affected Files**: `app/orders/page.tsx`
**Fix**: Completely remove `EditOrderDialog` and ensure clicking an order card routes directly to `/orders/[id]/edit`.

## 7. Step 2 Product Selection UX Is Wrong
**Root Cause**: The current implementation of Step 2 shows categories, products, and variants simultaneously with horizontal scrolling and floating elements, which is confusing for non-technical users.
**Affected Files**: `components/order-wizard/step2-products.tsx`
**Fix**: Rebuild as a clear vertical drill-down: Select Category -> Shows Products -> Select Product -> Shows Variants -> Select Variant -> Shows Qty/Add. Remove horizontal scrolling.

## 8. Success Screen Before Validation
**Root Cause**: `Step3Review` proceeds to `Step4Success` immediately if `createOrder` returns without throwing, even if the backend silently created an empty order.
**Affected Files**: `components/order-wizard/step3-review.tsx`, `components/order-wizard/step4-success.tsx`
**Fix**: Handled by Fix #2 (strict backend and frontend validation before executing `onSuccess`).

---

**Status**: Ready for Implementation
