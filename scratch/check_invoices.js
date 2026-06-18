const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  })
  console.log("Recent Invoices:", invoices)
}
main().catch(console.error).finally(() => prisma.$disconnect())
