"use server"

import { prisma } from "../../lib/prisma"
import { serializePrisma } from "../../lib/prisma-serializer"
import { revalidatePath } from "next/cache"

export async function getInvoices(filters?: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortDirection?: "asc" | "desc";
}) {
  const where: any = {};

  if (filters) {
    if (filters.status && filters.status !== "all") {
      where.paymentStatus = filters.status;
    }
    if (filters.search) {
      where.OR = [
        { invoiceNumber: { contains: filters.search, mode: "insensitive" } },
        { customer: { shop_name: { contains: filters.search, mode: "insensitive" } } },
        { customer: { city: { contains: filters.search, mode: "insensitive" } } },
      ];
    }
  }

  const page = filters?.page || 1;
  const limit = filters?.limit || 10;
  const skip = (page - 1) * limit;

  const orderBy: any = { invoiceDate: filters?.sortDirection || 'desc' };

  const [invoices, totalCount] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        customer: true,
        order: {
          include: {
            items: true
          }
        }
      }
    }),
    prisma.invoice.count({ where })
  ]);

  return serializePrisma({
    data: invoices,
    totalCount
  });
}

export async function getInvoiceById(id: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
      order: {
        include: {
          items: true
        }
      }
    }
  });
  
  return serializePrisma(invoice);
}

export async function getInvoicesByCustomer(customerId: string) {
  const invoices = await prisma.invoice.findMany({
    where: { customerId },
    orderBy: { invoiceDate: 'desc' },
    include: {
      order: {
        include: { items: true }
      }
    }
  });

  return serializePrisma(invoices);
}

export async function getInvoiceStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalInvoices,
    paidInvoices,
    pendingInvoices,
    totals,
  ] = await Promise.all([
    prisma.invoice.count(),
    prisma.invoice.count({ where: { paymentStatus: 'PAID' } }),
    prisma.invoice.count({ where: { paymentStatus: 'PENDING' } }),
    prisma.invoice.aggregate({
      _sum: { total: true },
      _avg: { total: true },
      where: { paymentStatus: 'PENDING' }
    }),
  ]);

  return {
    totalInvoices,
    paidInvoices,
    pendingInvoices,
    outstandingAmount: totals._sum.total || 0,
    averageInvoiceValue: totals._avg.total || 0,
  };
}

export async function updateInvoiceStatus(id: string, status: "PAID" | "PENDING" | "PARTIAL" | "CANCELLED") {
  const invoice = await prisma.invoice.update({
    where: { id },
    data: { paymentStatus: status }
  });

  revalidatePath('/invoices');
  revalidatePath('/summary');
  if (invoice.customerId) {
    revalidatePath(`/customers`);
  }

  return serializePrisma(invoice);
}

export async function deleteInvoice(id: string) {
  // First get the invoice to check if it's an order invoice
  const invoice = await prisma.invoice.findUnique({
    where: { id }
  });

  if (!invoice) throw new Error("Invoice not found");

  // Delete the invoice
  await prisma.invoice.delete({
    where: { id }
  });

  revalidatePath('/invoices');
  revalidatePath('/summary');
  revalidatePath('/orders');
  if (invoice.customerId) {
    revalidatePath(`/customers`);
  }
  if (invoice.orderId) {
    revalidatePath(`/orders/${invoice.orderId}`);
  }

  return { success: true };
}

export async function generateInvoiceForOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
      items: true,
      invoice: true
    }
  });

  if (!order) throw new Error("Order not found");
  if (order.invoice) return serializePrisma(order.invoice);

  // Generate a new invoice sequence
  const currentYear = new Date().getFullYear();
  const sequence = await prisma.invoiceSequence.upsert({
    where: { year: currentYear },
    update: { currentValue: { increment: 1 } },
    create: { year: currentYear, currentValue: 1 }
  });

  const invoiceNumber = `INV-${currentYear}-${String(sequence.currentValue).padStart(5, '0')}`;
  const subtotal = order.total_amount || 0;
  
  // Format items for PDF
  const items = order.items.map(item => ({
    name: `${item.productName} - ${item.variantName}`,
    quantity: item.quantity,
    rate: item.unitSellingPrice,
    amount: item.totalRevenue
  }));

  const invoiceData = {
    invoiceNumber,
    invoiceDate: new Date().toLocaleDateString('en-IN'),
    customerName: order.customer.shop_name,
    customerAddress: order.customer.address || '',
    customerCity: order.customer.city,
    customerPhone: order.customer.phone || undefined,
    items,
    subtotal: Number(subtotal),
    tax: 0,
    total: Number(subtotal),
  };

  // We don't generate the PDF file on disk anymore
  // Instead, the PDF is generated dynamically via the API route
  // The API route needs the invoice ID, but we don't have it yet, so we will update it after creation
  const pdfUrl = '';

  const paymentStatus = 
    (order.status.toLowerCase() === 'completed' || order.status.toLowerCase() === 'delivered') 
      ? 'PAID' 
      : 'PENDING';

  const newInvoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      orderId: order.id,
      customerId: order.customer.id,
      subtotal: Number(subtotal),
      tax: 0,
      total: Number(subtotal),
      paymentStatus,
      pdfUrl: '' // Will update immediately
    }
  });

  const finalPdfUrl = `/api/pdf/invoice/${newInvoice.id}`;
  
  await prisma.invoice.update({
    where: { id: newInvoice.id },
    data: { pdfUrl: finalPdfUrl }
  });

  revalidatePath('/orders');
  revalidatePath(`/orders/${order.id}`);
  revalidatePath('/invoices');
  
  // Return updated invoice
  return serializePrisma({ ...newInvoice, pdfUrl: finalPdfUrl });
}

export async function generateMonthlyStatement(customerId: string, month: number, year: number) {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      orders: {
        where: {
          created_at: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { created_at: 'asc' }
      }
    }
  });

  if (!customer) throw new Error("Customer not found");
  if (customer.orders.length === 0) throw new Error("No orders found for this month");

  const ordersList = customer.orders.map(o => ({
    orderNumber: o.id.slice(0, 8),
    orderDate: new Date(o.created_at).toLocaleDateString('en-IN'),
    total: Number(o.total_amount || 0)
  }));

  const totalAmount = ordersList.reduce((sum, o) => sum + o.total, 0);
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
  
  const statementMonthStr = startDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const statementData = {
    statementMonth: statementMonthStr,
    statementDate: new Date().toLocaleDateString('en-IN'),
    customerName: customer.shop_name,
    customerAddress: customer.address || '',
    customerCity: customer.city,
    customerPhone: customer.phone || undefined,
    orders: ordersList,
    totalAmount,
    totalOrders: customer.orders.length
  };

  // We no longer generate statements to disk
  // We use the dynamic API route for monthly statements
  // API needs customerId, month (1-indexed for the API route), and year
  const pdfUrl = `/api/pdf/statement?customerId=${customerId}&month=${month + 1}&year=${year}`;

  const currentYear = new Date().getFullYear();
  const sequence = await prisma.invoiceSequence.upsert({
    where: { year: currentYear },
    update: { currentValue: { increment: 1 } },
    create: { year: currentYear, currentValue: 1 }
  });

  const invoiceNumber = `STMT-${currentYear}-${String(sequence.currentValue).padStart(5, '0')}`;

  const newInvoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      customerId: customer.id,
      subtotal: totalAmount,
      tax: 0,
      total: totalAmount,
      pdfUrl: '' // Will update immediately
    }
  });

  const finalPdfUrl = `/api/pdf/statement?customerId=${customerId}&month=${month + 1}&year=${year}`;
  
  await prisma.invoice.update({
    where: { id: newInvoice.id },
    data: { pdfUrl: finalPdfUrl }
  });

  revalidatePath('/invoices');
  revalidatePath('/summary');
  return pdfUrl;
}

export async function generateGlobalMonthlyReport(month: number, year: number) {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

  const [orders, productStats] = await Promise.all([
    prisma.order.findMany({
      where: {
        created_at: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        customer: true,
      },
      orderBy: { created_at: 'asc' }
    }),
    prisma.orderItem.groupBy({
      by: ['productName', 'variantName'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: {
        quantity: true,
        totalRevenue: true
      },
      orderBy: {
        _sum: {
          totalRevenue: 'desc'
        }
      }
    })
  ]);

  if (orders.length === 0) throw new Error("No orders found for this month");

  let totalRevenue = 0;
  const ordersList = orders.map(o => {
    const amount = Number(o.total_amount || 0);
    totalRevenue += amount;
    return {
      orderNumber: o.id.slice(0, 8),
      date: new Date(o.created_at!).toLocaleDateString('en-IN'),
      customerName: o.customer.shop_name,
      city: o.city,
      amount
    };
  });

  let totalProductsSold = 0;
  const productSummary = productStats.map(p => {
    const qty = p._sum.quantity || 0;
    totalProductsSold += qty;
    return {
      name: `${p.productName} - ${p.variantName}`,
      quantity: qty,
      revenue: p._sum.totalRevenue || 0
    };
  });

  const statementMonthStr = startDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

  const reportData = {
    reportMonth: statementMonthStr,
    generatedDate: new Date().toLocaleDateString('en-IN'),
    totalRevenue,
    totalOrders: orders.length,
    totalProductsSold,
    productSummary,
    orders: ordersList
  };

  // No longer generating files to disk
  // API uses 1-indexed month
  const pdfUrl = `/api/pdf/report?month=${month + 1}&year=${year}`;

  return pdfUrl;
}
