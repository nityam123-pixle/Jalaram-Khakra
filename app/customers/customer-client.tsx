"use client"

import { useState, useMemo } from "react"
import { Search, Plus, MapPin, Phone, IndianRupee, Clock, TrendingUp, Calendar, FileText } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { getCustomerDetails, createCustomer } from "../actions/customers"
import { generateInvoiceForOrder, generateMonthlyStatement } from "../actions/invoice"
import { CITIES } from "@/lib/supabase"
import { InvoicePreviewCard } from "@/components/invoice/invoice-preview-card"

export function CustomerClient({ initialData }: { initialData: any[] }) {
  const [customers, setCustomers] = useState(initialData)
  const [searchQuery, setSearchQuery] = useState("")

  // Add dialog state
  const [addOpen, setAddOpen] = useState(false)
  const [addSaving, setAddSaving] = useState(false)
  const [newShop, setNewShop] = useState("")
  const [newCity, setNewCity] = useState(CITIES[0] ?? "")
  const [newAddress, setNewAddress] = useState("")
  const [newPhone, setNewPhone] = useState("")

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetLoading, setSheetLoading] = useState(false)
  const [sheetCustomer, setSheetCustomer] = useState<any>(null)
  const [generatingOrderId, setGeneratingOrderId] = useState<string | null>(null)

  // Statement generation state
  const [statementMonth, setStatementMonth] = useState<string>(`${new Date().getFullYear()}-${new Date().getMonth()}`)
  const [generatingStatement, setGeneratingStatement] = useState(false)

  // Generate last 6 months for dropdown
  const last6Months = useMemo(() => {
    const dates = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      dates.push({
        label: format(d, "MMMM yyyy"),
        value: `${d.getFullYear()}-${d.getMonth()}`
      });
    }
    return dates;
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return customers
    return customers.filter(
      (c) =>
        c.shop_name.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q)
    )
  }, [customers, searchQuery])

  const handleAddCustomer = async () => {
    if (!newShop.trim() || !newCity) {
      toast.error("Shop name and City are required")
      return
    }
    setAddSaving(true)
    try {
      await createCustomer({
        shop_name: newShop.trim(),
        city: newCity,
        address: newAddress.trim() || undefined,
        phone: newPhone.trim() || undefined,
      })
      toast.success("Customer added successfully")
      setAddOpen(false)
      // Note: Ideally revalidate or fetch new list. We'll refresh window for simplicity.
      window.location.reload()
    } catch (e: any) {
      toast.error(e.message || "Failed to add customer")
    } finally {
      setAddSaving(false)
    }
  }

  const openCustomerSheet = async (customer: any) => {
    setSheetOpen(true)
    setSheetLoading(true)
    try {
      const details = await getCustomerDetails(customer.id)
      setSheetCustomer(details)
    } catch (e) {
      toast.error("Failed to load customer details")
    } finally {
      setSheetLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "High Value": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 border-purple-200"
      case "Active": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-200"
      case "Dormant": return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200"
      case "New": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-blue-200"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const handleGenerateInvoice = async (orderId: string) => {
    setGeneratingOrderId(orderId)
    try {
      const inv = await generateInvoiceForOrder(orderId)
      toast.success("Invoice generated successfully")
      // Refresh customer details to show new invoice
      if (sheetCustomer) {
        const details = await getCustomerDetails(sheetCustomer.id)
        setSheetCustomer(details)
      }
      if (inv?.pdfUrl) {
        window.open(inv.pdfUrl, '_blank')
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to generate invoice")
    } finally {
      setGeneratingOrderId(null)
    }
  }

  const handleGenerateStatement = async () => {
    if (!sheetCustomer) return;
    setGeneratingStatement(true)
    try {
      const [year, month] = statementMonth.split('-').map(Number)
      const pdfUrl = await generateMonthlyStatement(sheetCustomer.id, month, year)
      window.open(pdfUrl, '_blank')
      toast.success("Statement generated successfully")
    } catch (e: any) {
      toast.error(e.message || "Failed to generate statement")
    } finally {
      setGeneratingStatement(false)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground mt-1">Manage your customer relationships and view their history.</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <div className="relative max-w-md mt-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search customers, cities, phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {filtered.map((c) => (
          <Card key={c.id} className="hover:border-primary/50 transition-colors flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{c.shop_name}</h3>
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    {c.city}
                  </div>
                </div>
                <Badge variant="outline" className={getStatusColor(c.status)}>
                  {c.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 pb-2">
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Lifetime Revenue</p>
                  <p className="font-semibold text-green-600">₹{c.lifetimeRevenue.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Orders</p>
                  <p className="font-semibold">{c.totalOrders}</p>
                </div>
                <div className="col-span-2 flex items-center text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  Last order: {c.lastOrderDate ? format(new Date(c.lastOrderDate), 'MMM d, yyyy') : 'Never'}
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-4 border-t">
              <Button variant="ghost" className="w-full text-primary" onClick={() => openCustomerSheet(c)}>
                View Profile & History
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground">No customers found.</p>
        </div>
      )}

      {/* Add Customer Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Shop Name</Label>
              <Input value={newShop} onChange={(e) => setNewShop(e.target.value)} placeholder="E.g. Shreeji Stores" />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Select value={newCity} onValueChange={setNewCity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Phone (Optional)</Label>
              <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+91 98250 83947" />
            </div>
            <div className="space-y-2">
              <Label>Address (Optional)</Label>
              <Textarea value={newAddress} onChange={(e) => setNewAddress(e.target.value)} placeholder="Full street address..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAddCustomer} disabled={addSaving}>{addSaving ? "Saving..." : "Add Customer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer Profile Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-[600px] w-[90vw] overflow-y-auto">
          <SheetHeader className={sheetCustomer && !sheetLoading ? "pb-4 border-b" : "sr-only"}>
            <SheetTitle className={sheetCustomer && !sheetLoading ? "text-2xl" : ""}>
              {sheetCustomer ? sheetCustomer.shop_name : "Customer Profile"}
            </SheetTitle>
            <SheetDescription className={sheetCustomer && !sheetLoading ? "flex items-center gap-4 mt-2" : ""}>
              {sheetCustomer ? (
                <>
                  <span className="flex items-center"><MapPin className="h-3 w-3 mr-1"/> {sheetCustomer.city}</span>
                  {sheetCustomer.phone && <span className="flex items-center"><Phone className="h-3 w-3 mr-1"/> {sheetCustomer.phone}</span>}
                </>
              ) : "Loading customer details..."}
            </SheetDescription>
          </SheetHeader>

          {sheetLoading ? (
            <div className="space-y-6 mt-6">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : sheetCustomer ? (
            <div className="space-y-6 mt-4">
              <Tabs defaultValue="insights">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="insights">Insights</TabsTrigger>
                  <TabsTrigger value="orders">Orders ({sheetCustomer.orders.length})</TabsTrigger>
                  <TabsTrigger value="invoices">Invoices ({sheetCustomer.invoices.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="insights" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm font-medium">Customer Since</span>
                        </div>
                        <p className="text-xl font-bold">{format(new Date(sheetCustomer.created_at || new Date()), 'MMM yyyy')}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-sm font-medium">Total Spent</span>
                        </div>
                        <p className="text-xl font-bold text-green-600">
                          ₹{sheetCustomer.orders.reduce((sum: number, o: any) => sum + Number(o.total_amount || 0), 0).toLocaleString('en-IN')}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                  {sheetCustomer.address && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Billing Address</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{sheetCustomer.address}</p>
                      </CardContent>
                    </Card>
                  )}

                  <Card className="col-span-2 mt-4">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Monthly Statements</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <Select value={statementMonth} onValueChange={setStatementMonth}>
                          <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Select Month" />
                          </SelectTrigger>
                          <SelectContent>
                            {last6Months.map(m => (
                              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button onClick={handleGenerateStatement} disabled={generatingStatement} className="w-full sm:w-auto">
                          <FileText className="h-4 w-4 mr-2" />
                          {generatingStatement ? "Generating..." : "Generate PDF"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="orders" className="mt-4 space-y-4">
                  {sheetCustomer.orders.map((order: any) => {
                    const hasInvoice = sheetCustomer.invoices?.some((i:any) => i.orderId === order.id);
                    const inv = sheetCustomer.invoices?.find((i:any) => i.orderId === order.id);
                    return (
                    <Card key={order.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="font-semibold">Order #{order.id.slice(0,8)}</p>
                            <p className="text-sm text-muted-foreground">{format(new Date(order.created_at), 'PPP')}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold mb-2">₹{Number(order.total_amount).toLocaleString('en-IN')}</p>
                            {!hasInvoice ? (
                              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleGenerateInvoice(order.id)} disabled={generatingOrderId === order.id}>
                                <FileText className="w-3 h-3 mr-1" /> {generatingOrderId === order.id ? "Wait..." : "Generate Invoice"}
                              </Button>
                            ) : (
                              <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                                <a href={inv?.pdfUrl} download={`${inv?.invoiceNumber}.pdf`}>
                                  <FileText className="w-3 h-3 mr-1" /> Download Invoice
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {order.items.map((item: any, idx: number) => (
                            <Badge key={idx} variant="secondary">
                              {item.productName} ({item.variantName}) x{item.quantity}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )})}
                  {sheetCustomer.orders.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">No orders found.</p>
                  )}
                </TabsContent>

                <TabsContent value="invoices" className="mt-4 space-y-4">
                  {sheetCustomer.invoices.map((invoice: any) => (
                    <InvoicePreviewCard key={invoice.id} invoice={invoice} />
                  ))}
                  {sheetCustomer.invoices.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">No invoices found.</p>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  )
}
