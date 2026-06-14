# Customer Relation Audit

## Issue
Customer relation implementation status is unclear.

## Root Cause Analysis
- `schema.prisma` contains `customerId String @db.Uuid` and `customer Customer @relation(fields: [customerId], references: [id])` on the `Order` model.
- The `migrate-orders.ts` script was executed and it successfully mapped legacy `shop_name`, `city`, `address` to the central `customers` table.
- The constraint and foreign key are active in PostgreSQL.
- The issue is solely Prisma Client typings mismatching the active DB schema on the dev machine.

## Conclusion
The database relation is SAFE and COMPLETE. Prisma client requires generation and Next.js server restart.
