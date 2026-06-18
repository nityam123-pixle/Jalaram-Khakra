"use client"

import { useState, useEffect } from "react"
import { format, parse } from "date-fns"
import { FileText, Download, Printer, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { getMonthlyOrdersByCustomer } from "@/app/actions/analytics"
import { generateMonthlyStatement, generateInvoiceForOrder, generateGlobalMonthlyReport } from "@/app/actions/invoice"

interface MonthlyOrdersSheetProps {
  monthKey: string | null; // e.g. "2026-06"
  onClose: () => void;
}

export function MonthlyOrdersSheet({ monthKey, onClose }: MonthlyOrdersSheetProps) {
  const [data, setData] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [generatingOrderId, setGeneratingOrderId] = useState<string | null>(null)
  const [generatingGlobal, setGeneratingGlobal] = useState(false)

  useEffect(() => {
    if (monthKey) {
      setLoading(true)
      const [year, month] = monthKey.split('-').map(Number)
      // month is 1-12 from monthKey
      getMonthlyOrdersByCustomer(year, month - 1).then(res => {
        setData(res)
        setLoading(false)
      }).catch(() => {
        toast.error("Failed to load monthly orders")
        setLoading(false)
      })
    } else {
      setData(null)
    }
  }, [monthKey])

  const handleGenerateStatement = async (customerId: string) => {
    if (!monthKey) return;
    setGeneratingId(customerId)
    try {
      const [year, month] = monthKey.split('-').map(Number)
      const pdfUrl = await generateMonthlyStatement(customerId, month - 1, year)
      
      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => printWindow.print();
      }
      toast.success("Statement generated successfully")
    } catch (e: any) {
      toast.error(e.message || "Failed to generate statement")
    } finally {
      setGeneratingId(null)
    }
  }

  const handleGenerateOrderInvoice = async (order: any) => {
    if (order.invoice?.pdfUrl) {
      const printWindow = window.open(order.invoice.pdfUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => printWindow.print();
      }
      return;
    }

    setGeneratingOrderId(order.id)
    try {
      const invoice = await generateInvoiceForOrder(order.id)
      if (invoice.pdfUrl) {
        // Update local state to reflect the new invoice
        setData(prev => prev ? prev.map(c => ({
          ...c,
          orders: c.orders.map((o: any) => o.id === order.id ? { ...o, invoice } : o)
        })) : null)
        
        const printWindow = window.open(invoice.pdfUrl, '_blank');
        if (printWindow) {
          printWindow.onload = () => printWindow.print();
        }
        toast.success("Invoice generated successfully")
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to generate invoice")
    } finally {
      setGeneratingOrderId(null)
    }
  }

  const handleGenerateGlobalReport = async () => {
    if (!monthKey) return;
    setGeneratingGlobal(true);
    try {
      const [year, month] = monthKey.split('-').map(Number);
      const pdfUrl = await generateGlobalMonthlyReport(month - 1, year);
      
      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => printWindow.print();
      }
      toast.success("Month report generated successfully");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate month report");
    } finally {
      setGeneratingGlobal(false);
    }
  }

  const formattedMonth = monthKey 
    ? format(parse(monthKey, 'yyyy-MM', new Date()), 'MMMM yyyy') 
    : ""

  const totalOrdersInMonth = data ? data.reduce((acc, customer) => acc + customer.orders.length, 0) : 0;

  return (
    <Sheet open={!!monthKey} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-[700px] w-[90vw] overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <SheetTitle className="text-2xl flex items-center gap-2">
                Orders for {formattedMonth}
                {data && data.length > 0 && (
                  <Badge variant="secondary" className="text-sm">
                    {totalOrdersInMonth} {totalOrdersInMonth === 1 ? 'Order' : 'Orders'}
                  </Badge>
                )}
              </SheetTitle>
              <SheetDescription>
                Grouped by customer. Generate monthly statements from here.
              </SheetDescription>
            </div>
            <Button 
              onClick={handleGenerateGlobalReport} 
              disabled={generatingGlobal || !data || data.length === 0}
            >
              <FileText className="mr-2 h-4 w-4" />
              {generatingGlobal ? "Generating..." : "Month Report"}
            </Button>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))
          ) : data?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border rounded-lg bg-muted/20">
              No orders found for this month.
            </div>
          ) : (
            data?.map((customer) => (
              <Card key={customer.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{customer.shop_name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{customer.city}</p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleGenerateStatement(customer.id)}
                      disabled={generatingId === customer.id}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      {generatingId === customer.id ? "Generating..." : "Generate Statement"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mt-2 mb-4 p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Orders</p>
                      <p className="font-semibold">{customer.orders.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Amount</p>
                      <p className="font-semibold text-green-600">₹{customer.totalAmount.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Order History:</p>
                    {customer.orders.map((order: any) => (
                      <div key={order.id} className="flex flex-col sm:flex-row justify-between sm:items-center text-sm p-3 border rounded gap-2">
                        <div>
                          <span className="font-medium block">#{order.id.slice(0, 8)}</span>
                          <span className="text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-3 justify-between sm:justify-end">
                          <span className="font-semibold text-green-600">₹{Number(order.total_amount).toLocaleString('en-IN')}</span>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleGenerateOrderInvoice(order)}
                            disabled={generatingOrderId === order.id}
                          >
                            {generatingOrderId === order.id ? (
                              <span className="flex items-center"><Printer className="mr-2 h-3 w-3 animate-pulse" /> Generating...</span>
                            ) : order.invoice?.pdfUrl ? (
                              <span className="flex items-center"><Download className="mr-2 h-3 w-3" /> Download</span>
                            ) : (
                              <span className="flex items-center"><FileText className="mr-2 h-3 w-3" /> Generate</span>
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
