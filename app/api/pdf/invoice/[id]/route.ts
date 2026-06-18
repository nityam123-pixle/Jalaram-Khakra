import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderInvoiceToStream } from "@/lib/pdf-generator";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Fetch invoice and associated order
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            items: true
          }
        },
        customer: true
      }
    });

    if (!invoice) {
      return new NextResponse("Invoice not found", { status: 404 });
    }

    // Check if it's a regular invoice with an order, or a statement (no order)
    if (!invoice.order) {
      return new NextResponse("This invoice is a statement, please use the statement API", { status: 400 });
    }

    // Construct InvoiceData
    const invoiceData = {
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: new Date(invoice.invoiceDate).toLocaleDateString('en-IN'),
      dueDate: invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN') : undefined,
      customerName: invoice.customer.shop_name,
      customerAddress: invoice.customer.address || '',
      customerCity: invoice.customer.city,
      customerPhone: invoice.customer.phone || undefined,
      items: invoice.order.items.map(item => ({
        name: `${item.productName} (${item.variantName})`,
        quantity: item.quantity,
        rate: item.unitSellingPrice,
        amount: item.totalRevenue
      })),
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      total: invoice.total
    };

    // Render to stream
    const stream: any = await renderInvoiceToStream(invoiceData);

    // Convert NodeJS ReadableStream to Web ReadableStream
    const readableStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk: Buffer) => controller.enqueue(chunk));
        stream.on('end', () => controller.close());
        stream.on('error', (err: Error) => controller.error(err));
      }
    });

    // Return the response as a PDF
    return new NextResponse(readableStream, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${invoice.invoiceNumber}.pdf"`
      }
    });

  } catch (error) {
    console.error("[PDF Invoice API Error]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
