"use client"

import { useState, useMemo, useEffect } from "react"
import { format } from "date-fns"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Phone, Calendar, TrendingUp, FileText, Plus } from "lucide-react"
import { toast } from "sonner"
import { getCustomerDetails } from "@/app/actions/customers"
import { generateInvoiceForOrder, generateMonthlyStatement } from "@/app/actions/invoice"
import { InvoicePreviewCard } from "@/components/invoice/invoice-preview-card"

interface CustomerProfileSheetProps {
  customer: any | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function CustomerProfileSheet({
  customer,
  isOpen,
  onOpenChange,
}: CustomerProfileSheetProps) {
  const [details, setDetails] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [generatingOrderId, setGeneratingOrderId] = useState<string | null>(null)
  const [statementMonth, setStatementMonth] = useState<string>(
    `${new Date().getFullYear()}-${new Date().getMonth()}`
  )
  const [generatingStatement, setGeneratingStatement] = useState(false)

  // Last 6 months for statements dropdown
  const last6Months = useMemo(() => {
    const dates = []
    const now = new Date()
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      dates.push({
        label: format(d, "MMMM yyyy"),
        value: `${d.getFullYear()}-${d.getMonth()}`,
      })
    }
    return dates
  }, [])

  useEffect(() => {
    if (!isOpen || !customer?.id) {
      setDetails(null)
      return
    }

    let isMounted = true
    setLoading(true)

    getCustomerDetails(customer.id)
      .then((data) => {
        if (isMounted) setDetails(data)
      })
      .catch(() => {
        toast.error("Failed to load customer profile details")
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [customer?.id, isOpen])

  const handleGenerateInvoice = async (orderId: string) => {
    setGeneratingOrderId(orderId)
    try {
      const inv = await generateInvoiceForOrder(orderId)
      toast.success("Invoice generated successfully")
      if (customer?.id) {
        const refreshed = await getCustomerDetails(customer.id)
        setDetails(refreshed)
      }
      if (inv?.pdfUrl) {
        window.open(inv.pdfUrl, "_blank")
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to generate invoice")
    } finally {
      setGeneratingOrderId(null)
    }
  }

  const handleGenerateStatement = async () => {
    if (!customer?.id) return
    setGeneratingStatement(true)
    try {
      const [year, month] = statementMonth.split("-").map(Number)
      const pdfUrl = await generateMonthlyStatement(customer.id, month, year)
      window.open(pdfUrl, "_blank")
      toast.success("Statement generated successfully")
    } catch (e: any) {
      toast.error(e.message || "Failed to generate statement")
    } finally {
      setGeneratingStatement(false)
    }
  }

  const activeCustomer = details || customer

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[620px] w-[95vw] overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-start justify-between pr-6">
            <div>
              <SheetTitle className="text-xl font-bold">
                {activeCustomer?.shop_name || "Customer Profile"}
              </SheetTitle>
              <SheetDescription className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                {activeCustomer?.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    {activeCustomer.city}
                  </span>
                )}
                {activeCustomer?.phone && (
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    {activeCustomer.phone}
                  </span>
                )}
              </SheetDescription>
            </div>
            {activeCustomer?.id && (
              <Button size="sm" variant="outline" className="h-8 gap-1 text-xs shrink-0" asChild>
                <a href={`/orders/new?customerId=${activeCustomer.id}`}>
                  <Plus className="h-3 w-3" />
                  <span>New Order</span>
                </a>
              </Button>
            )}
          </div>
        </SheetHeader>

        {loading ? (
          <div className="space-y-6 mt-6">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : activeCustomer ? (
          <div className="space-y-6 mt-4">
            <Tabs defaultValue="insights">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="insights">Insights</TabsTrigger>
                <TabsTrigger value="orders">
                  Orders ({details?.orders?.length ?? activeCustomer?.totalOrders ?? 0})
                </TabsTrigger>
                <TabsTrigger value="invoices">
                  Invoices ({details?.invoices?.length ?? 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="insights" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="border border-border/80">
                    <CardContent className="pt-5">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
                        <Calendar className="h-4 w-4" />
                        <span className="text-xs font-medium">Customer Since</span>
                      </div>
                      <p className="text-lg font-bold font-mono">
                        {activeCustomer?.createdAt
                          ? format(new Date(activeCustomer.createdAt), "MMM yyyy")
                          : "N/A"}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border border-border/80">
                    <CardContent className="pt-5">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-xs font-medium">Total Spent</span>
                      </div>
                      <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        ₹
                        {(
                          details?.orders?.reduce(
                            (sum: number, o: any) => sum + Number(o.total_amount || 0),
                            0
                          ) ?? activeCustomer?.lifetimeRevenue ?? 0
                        ).toLocaleString("en-IN")}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {activeCustomer?.address && (
                  <Card className="border border-border/80">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Billing Address
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-foreground">{activeCustomer.address}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Monthly Statements */}
                <Card className="border border-border/80">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Monthly Statements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <Select value={statementMonth} onValueChange={setStatementMonth}>
                        <SelectTrigger className="w-full sm:w-[200px] text-xs h-9">
                          <SelectValue placeholder="Select Month" />
                        </SelectTrigger>
                        <SelectContent>
                          {last6Months.map((m) => (
                            <SelectItem key={m.value} value={m.value} className="text-xs">
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        onClick={handleGenerateStatement}
                        disabled={generatingStatement}
                        className="h-9 gap-2 text-xs"
                      >
                        <FileText className="h-4 w-4" />
                        <span>{generatingStatement ? "Generating..." : "Generate PDF"}</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="orders" className="mt-4 space-y-3">
                {(details?.orders ?? []).map((order: any) => {
                  const inv = details?.invoices?.find((i: any) => i.orderId === order.id)
                  const hasInvoice = Boolean(inv)
                  return (
                    <Card key={order.id} className="border border-border/80">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-semibold text-sm font-mono">
                              #{order.id.slice(0, 8).toUpperCase()}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {order.created_at ? format(new Date(order.created_at), "PPP") : "N/A"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm font-mono">
                              ₹{Number(order.total_amount || 0).toLocaleString("en-IN")}
                            </p>
                            <div className="mt-1">
                              {!hasInvoice ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => handleGenerateInvoice(order.id)}
                                  disabled={generatingOrderId === order.id}
                                >
                                  <FileText className="w-3 h-3 mr-1" />
                                  <span>{generatingOrderId === order.id ? "Wait..." : "Invoice"}</span>
                                </Button>
                              ) : (
                                <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                                  <a href={inv?.pdfUrl} download={`${inv?.invoiceNumber}.pdf`}>
                                    <FileText className="w-3 h-3 mr-1" />
                                    <span>Download</span>
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(order.items ?? []).map((item: any, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-[10px] font-normal">
                              {item.productName} ({item.variantName}) x{item.quantity}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
                {(!details?.orders || details.orders.length === 0) && (
                  <p className="text-muted-foreground text-center py-8 text-sm">No orders found.</p>
                )}
              </TabsContent>

              <TabsContent value="invoices" className="mt-4 space-y-3">
                {(details?.invoices ?? []).map((invoice: any) => (
                  <InvoicePreviewCard key={invoice.id} invoice={invoice} />
                ))}
                {(!details?.invoices || details.invoices.length === 0) && (
                  <p className="text-muted-foreground text-center py-8 text-sm">No invoices found.</p>
                )}
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
