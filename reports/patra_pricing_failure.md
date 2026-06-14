# Patra Pricing Failure

## Issue
Patra prices show as NaN, Blank, or ₹0 in the UI.

## Root Cause
The `Step2Products` Wizard relies on `activeVariant?.pricingRules[0]`. However, Patra was manually migrated into the Prisma Catalog, and if the `PricingRule` relation is empty or not seeded correctly for that specific variant, `pricingRules[0]` is undefined. The UI blindly performed `Number(undefined.costPrice)`, resulting in `NaN`.

## Solution Implemented
1. `Step2Products` now explicitly checks `if (!pricingRule)` and renders an "Alert: Pricing unavailable" empty state.
2. Safe fallbacks `Number(pricingRule?.costPrice || 0)` prevent `NaN` arithmetic propagation.
