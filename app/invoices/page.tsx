import { getInvoices, getInvoiceStats } from "../actions/invoice"
import { InvoicesClient } from "./invoices-client"

export const dynamic = "force-dynamic"

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>
}) {
  const resolvedParams = await searchParams;
  const page = Number(resolvedParams.page) || 1;
  const limit = 20;
  
  const [invoicesData, stats] = await Promise.all([
    getInvoices({
      page,
      limit,
      search: resolvedParams.search,
      status: resolvedParams.status
    }),
    getInvoiceStats()
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <InvoicesClient 
        initialData={invoicesData} 
        stats={stats} 
        currentPage={page}
        currentSearch={resolvedParams.search || ""}
        currentStatus={resolvedParams.status || "all"}
      />
    </div>
  )
}
