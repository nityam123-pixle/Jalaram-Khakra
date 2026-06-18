"use client"

import { useState, useEffect, useTransition } from "react"

import { format } from "date-fns"
import { Search, FileText, Download, TrendingUp, IndianRupee, Printer, ExternalLink } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { updateInvoiceStatus, deleteInvoice } from "../actions/invoice"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Trash2 } from "lucide-react"

export function InvoicesClient({ initialData, stats, currentPage: _currentPage, currentSearch, currentStatus: _currentStatus }: any) {
  const [data, setData] = useState(initialData)
  const [currentPage, setCurrentPage] = useState(1)
  const [currentStatus, setCurrentStatus] = useState("all")
  const [isPending, startTransition] = useTransition()

  const [search, setSearch] = useState(currentSearch || "")
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadData = async (page: number, s: string, status: string) => {
    startTransition(async () => {
      const { getInvoices } = await import("../actions/invoice")
      const result = await getInvoices({ page, limit: 20, search: s, status })
      setData(result)
    })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    loadData(1, search, currentStatus)
  }

  const setStatus = (val: string) => {
    setCurrentStatus(val)
    setCurrentPage(1)
    loadData(1, search, val)
  }

  const setPage = (val: number) => {
    setCurrentPage(val)
    loadData(val, search, currentStatus)
  }


  const handleStatusChange = async (invoiceId: string, newStatus: string) => {
    setUpdatingId(invoiceId)
    try {
      await updateInvoiceStatus(invoiceId, newStatus as any)
      toast.success("Invoice status updated")
      loadData(currentPage, search, currentStatus)
    } catch (e) {
      toast.error("Failed to update invoice status")
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async (invoiceId: string) => {
    setDeletingId(invoiceId)
    try {
      await deleteInvoice(invoiceId)
      toast.success("Invoice deleted successfully")
      loadData(currentPage, search, currentStatus)
    } catch (e) {
      toast.error("Failed to delete invoice")
    } finally {
      setDeletingId(null)
    }
  }

  const handlePrint = (url: string) => {
    if (url) {
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => printWindow.print();
      }
    }
  }

  const statusColors: Record<string, string> = {
    PAID: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
    PARTIAL: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing Center</h1>
          <p className="text-muted-foreground mt-1">Manage invoices, payments, and generate monthly statements.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInvoices}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Invoices</CardTitle>
            <IndianRupee className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.paidInvoices}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
            <FileText className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.pendingInvoices}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">₹{stats.outstandingAmount.toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between mt-6">
        <Tabs value={currentStatus} onValueChange={setStatus}>
          <TabsList>
            <TabsTrigger value="all">All Invoices</TabsTrigger>
            <TabsTrigger value="PENDING">Pending</TabsTrigger>
            <TabsTrigger value="PAID">Paid</TabsTrigger>
            <TabsTrigger value="CANCELLED">Cancelled</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <form onSubmit={handleSearch} className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search invoice or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </form>
      </div>

      <div className="border rounded-md mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice No.</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className={isPending ? "opacity-50" : ""}>
            {data.data.map((invoice: any) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                <TableCell>{format(new Date(invoice.invoiceDate), 'MMM d, yyyy')}</TableCell>
                <TableCell>
                  <div className="font-medium">{invoice.customer?.shop_name}</div>
                  <div className="text-xs text-muted-foreground">{invoice.customer?.city}</div>
                </TableCell>
                <TableCell className="font-semibold">₹{Number(invoice.total).toLocaleString('en-IN')}</TableCell>
                <TableCell>
                  <Select 
                    disabled={updatingId === invoice.id}
                    value={invoice.paymentStatus} 
                    onValueChange={(val) => handleStatusChange(invoice.id, val)}
                  >
                    <SelectTrigger className={`w-[120px] h-8 text-xs ${statusColors[invoice.paymentStatus] || ""}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="PARTIAL">Partial</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {invoice.pdfUrl && (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => handlePrint(invoice.pdfUrl)} title="Print">
                          <Printer className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" asChild title="Download">
                          <a href={invoice.pdfUrl} download={`${invoice.invoiceNumber}.pdf`}>
                            <Download className="h-4 w-4 text-muted-foreground" />
                          </a>
                        </Button>
                        <Button variant="ghost" size="icon" asChild title="Open PDF">
                          <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          </a>
                        </Button>
                      </>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" title="Delete Invoice" disabled={deletingId === invoice.id}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete invoice {invoice.invoiceNumber}. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDelete(invoice.id)}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {data.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No invoices found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {data.totalCount > 20 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * 20 + 1} to Math.min(currentPage * 20, data.totalCount) of {data.totalCount} entries
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1 || isPending}
              onClick={() => setPage(currentPage - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage * 20 >= data.totalCount || isPending}
              onClick={() => setPage(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
