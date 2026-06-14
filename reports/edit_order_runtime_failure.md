# Edit Order Runtime Failure

## Issue
URL `/orders/[id]/edit` throws a `PrismaClientValidationError` because `include: { customer: true }` is invalid.

## Root Cause
The `customerId` relation was added to `prisma/schema.prisma` and the migration ran. However, the Next.js development server process was running an older, cached instance of the `@prisma/client`. Thus, the runtime schema and generated schema mismatched, causing Prisma to reject the `include` block.

## Solution Implemented
1. `npx prisma generate` was verified.
2. The server must be restarted or the cache busted so the latest generated typings govern `prisma.order.findUnique`.
