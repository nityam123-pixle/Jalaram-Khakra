import { PrismaClient } from '@prisma/client';
import { generateInvoiceForOrder } from '../app/actions/invoice';

const prisma = new PrismaClient();

async function main() {
  const order = await prisma.order.findFirst({
    where: { invoice: null }
  });
  if (!order) {
    console.log("No order without invoice found");
    return;
  }
  
  console.log("Generating invoice for order:", order.id);
  const result = await generateInvoiceForOrder(order.id);
  console.log("Invoice generated:", result);
  
  const inDb = await prisma.invoice.findUnique({ where: { id: result.id } });
  console.log("In DB:", inDb);
}

main().catch(console.error).finally(() => prisma.$disconnect());
