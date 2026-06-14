# Order System Forensic Audit

## 1. Files Modified / Created
- `app/orders/[id]/edit/page.tsx` (Created)
- `app/orders/[id]/edit/edit-client.tsx` (Created)
- `app/orders/[id]/page.tsx` (Created)
- `components/order-wizard/wizard.tsx` (Modified)
- `components/order-wizard/step1-customer.tsx` (Created)
- `components/order-wizard/step2-products.tsx` (Created & Modified)
- `components/order-wizard/step3-review.tsx` (Created & Modified)
- `components/order-wizard/step4-success.tsx` (Created)
- `app/actions/order.ts` (Modified: Added `getOrderById`, `updateOrderStatus`, updated `createOrder`)
- `app/actions/customers.ts` (Created)
- `app/orders/page.tsx` (Modified: Removed `EditOrderDialog`, replaced `NewOrderDialog`)

## 2. Routes Touched
- `/orders` (Modified)
- `/orders/new` (Created)
- `/orders/[id]/edit` (Created)
- `/orders/[id]` (Created)

## 3. Prisma Queries Modified
- `getOrderById`: Added `include: { customer: true, items: true }`
- `updateOrderStatus`: Added `prisma.order.update`
- `createOrder`: Refactored to fetch active `PricingRules`, compute revenue/profit dynamically, and update `Customer.totalOrders`.

## 4. Schema Changes Introduced
- `Order.customerId` (UUID, Foreign Key mapping to `Customer`)
- `Customer.totalOrders`, `Customer.lastOrderAt`, `Customer.isArchived`, `Customer.mergedIntoCustomerId`

## 5. Migrations Executed
- A customer linkage migration was previously created (`link-orders-to-customers.ts`)
- Duplicate customer merge migration was executed (`merge-customers.ts`)

## 6. Current Component Health Map
### Working Components
- Customer Merge script (successfully merged 7 branches).
- Analytics `app/actions/analytics.ts` natively pulls from `OrderItem.totalRevenue`.

### Broken Components
- `/orders/[id]/edit/page.tsx` throws `PrismaClientValidationError` because the Next.js dev server has a stale cached version of Prisma Client that doesn't recognize the `include: { customer: true }` relation on `Order`.
- Serialization error (Decimal) persists because Next.js passes `OrderItem.total_revenue` (Decimal type) to Client Components unmapped.
- `app/actions/order.ts` (`createOrder`) lacks robust cart/revenue verification causing ₹0 orders to proceed.

### Duplicate Implementations
- The old `components/edit-order-dialog.tsx` and `components/new-order-dialog.tsx` still exist in the repository despite the new routes being created.

### Dead Routes & Unused Pages
- None introduced, but old dialog components are now orphaned logic.

## 7. Current Architecture State
The schema and database have `customerId` successfully mapped. The Prisma Client has been regenerated (`v7.8.0`). However, due to Next.js server caching or unmapped fields, the `Decimal` types and stale relation validation caused runtime failures.
