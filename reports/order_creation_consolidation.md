# Order Creation Consolidation

## Issue
Two competing order creation systems existed: The old `<NewOrderDialog>` modal and the new `/orders/new` Wizard.

## Root Cause
The new Wizard was built without entirely replacing the `<NewOrderDialog>` imports across the app. `app/orders/page.tsx` still had it rendered conditionally for empty states.

## Solution Implemented
All references to `<NewOrderDialog>` and `<EditOrderDialog>` have been removed from `app/orders/page.tsx`. Buttons now universally use Next.js `<Link href="/orders/new">` and `router.push('/orders/[id]/edit')`. There is now ONE single source of truth for order creation.
