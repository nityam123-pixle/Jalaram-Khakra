import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderMonthlyStatementToStream } from "@/lib/pdf-generator";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');
    const month = parseInt(searchParams.get('month') || '0', 10);
    const year = parseInt(searchParams.get('year') || '0', 10);

    if (!customerId || !month || !year) {
      return new NextResponse("Missing customerId, month, or year", { status: 400 });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

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

    if (!customer) return new NextResponse("Customer not found", { status: 404 });
    if (customer.orders.length === 0) return new NextResponse("No orders found", { status: 404 });

    const ordersList = customer.orders.map(o => ({
      orderNumber: o.id.slice(0, 8),
      orderDate: new Date(o.created_at!).toLocaleDateString('en-IN'),
      total: Number(o.total_amount || 0)
    }));

    const totalAmount = ordersList.reduce((sum, o) => sum + o.total, 0);
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

    const stream: any = await renderMonthlyStatementToStream(statementData);

    const readableStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk: Buffer) => controller.enqueue(chunk));
        stream.on('end', () => controller.close());
        stream.on('error', (err: Error) => controller.error(err));
      }
    });

    const safeCustomerName = customer.shop_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `statement_${safeCustomerName}_${year}_${month}.pdf`;

    return new NextResponse(readableStream, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${fileName}"`
      }
    });

  } catch (error) {
    console.error("[PDF Statement API Error]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
