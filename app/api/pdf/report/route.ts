import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderGlobalMonthlyReportToStream } from "@/lib/pdf-generator";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const month = parseInt(searchParams.get('month') || '0', 10);
    const year = parseInt(searchParams.get('year') || '0', 10);

    if (!month || !year) {
      return new NextResponse("Missing month or year", { status: 400 });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

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

    if (orders.length === 0) return new NextResponse("No orders found", { status: 404 });

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

    const reportData = {
      reportMonth: statementMonthStr,
      generatedDate: new Date().toLocaleDateString('en-IN'),
      totalRevenue,
      totalOrders: orders.length,
      totalProductsSold,
      productSummary,
      orders: ordersList
    };

    const stream: any = await renderGlobalMonthlyReportToStream(reportData);

    const readableStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk: Buffer) => controller.enqueue(chunk));
        stream.on('end', () => controller.close());
        stream.on('error', (err: Error) => controller.error(err));
      }
    });

    const fileName = `global_report_${year}_${month}.pdf`;

    return new NextResponse(readableStream, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${fileName}"`
      }
    });

  } catch (error) {
    console.error("[PDF Report API Error]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
