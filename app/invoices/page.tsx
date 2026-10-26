import {
  getInvoices,
  getInvoiceStats,
  getAllCustomersForInvoices,
} from "../actions/invoice"
import { InvoicesCommandCenter } from "@/components/invoices/invoices-command-center"

export const dynamic = "force-dynamic"

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string
    search?: string
    status?: string
    customer?: string
  }>
}) {
  const resolvedParams = await searchParams
  const page = Number(resolvedParams.page) || 1
  const limit = 10

  const [invoicesData, stats, customersList] = await Promise.all([
    getInvoices({
      page,
      limit,
      search: resolvedParams.search,
      status: resolvedParams.status,
      customerId: resolvedParams.customer,
      startDate: "2026-10-01T00:00:00.000Z",
      endDate: "2026-10-31T23:59:59.999Z",
    }),
    getInvoiceStats({
      startDate: "2026-10-01T00:00:00.000Z",
      endDate: "2026-10-31T23:59:59.999Z",
    }),
    getAllCustomersForInvoices(),
  ])

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
      <InvoicesCommandCenter
        initialInvoices={invoicesData}
        initialStats={stats}
        customersList={customersList}
      />
    </div>
  )
}
