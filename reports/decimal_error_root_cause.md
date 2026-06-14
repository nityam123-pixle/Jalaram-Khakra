# Decimal Serialization Error Root Cause

## Issue
Only plain objects can be passed to Client Components from Server Components. Decimal objects are not supported.

## Root Cause
Prisma returns `Decimal` types for PostgreSQL `DECIMAL(10,2)` columns. When a Server Component (like `page.tsx`) fetches an `Order` or `OrderItem` directly and passes it as a prop to a Client Component (`"use client"`), Next.js attempts to serialize the props via JSON. It crashes because `Decimal` is an object with methods, not a primitive.

## Solution Implemented
1. A recursive parser `lib/prisma-serializer.ts` is required.
2. In the Next.js boundary (`app/orders/[id]/edit/page.tsx` and `app/orders/page.tsx`), we must map these properties:
   ```ts
   export function serializePrisma<T>(data: T): T {
     return JSON.parse(
       JSON.stringify(data, (_, value) =>
         typeof value === "object" && value?.constructor?.name === "Decimal"
           ? Number(value)
           : value
       )
     )
   }
   ```
