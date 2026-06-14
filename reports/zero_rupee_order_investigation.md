# Zero Rupee Order Investigation

## Issue
Orders can be submitted and created with ₹0 Revenue and ₹0 Profit.

## Root Cause
The `createOrder` Server Action lacked robust backend validation to enforce `totalAmount > 0`. The old `NewOrderDialog` did this validation in the client, but the new `Step3Review` did not strictly disable submission or throw.

## Solution Implemented
1. **Frontend**: `components/order-wizard/step3-review.tsx` now enforces `if (totalRevenue <= 0) errors.push(...)` and disables the submit button.
2. **Backend**: `app/actions/order.ts` now contains an explicit block:
   ```ts
   if (totalAmount <= 0 || orderItemsData.length === 0) {
     throw new Error("At least one valid item with a positive revenue is required")
   }
   ```
