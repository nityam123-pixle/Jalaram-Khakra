"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { FileText, Download, Printer, ExternalLink } from "lucide-react"
import { format } from "date-fns"

interface InvoicePreviewCardProps {
  invoice: any;
  onView?: () => void;
}

export function InvoicePreviewCard({ invoice, onView }: InvoicePreviewCardProps) {
  if (!invoice) return null;

  const handlePrint = () => {
    if (invoice.pdfUrl) {
      const printWindow = window.open(invoice.pdfUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }
  };

  const handleDownload = () => {
    if (invoice.pdfUrl) {
      const link = document.createElement('a');
      link.href = invoice.pdfUrl;
      link.download = `${invoice.invoiceNumber}.pdf`;
      link.click();
    }
  };

  const statusColors: Record<string, string> = {
    PAID: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
    PARTIAL: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-xl flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            {invoice.invoiceNumber}
          </CardTitle>
          <div className="text-sm text-muted-foreground mt-1">
            {invoice.customer?.shop_name}
          </div>
        </div>
        <Badge variant="outline" className={statusColors[invoice.paymentStatus] || "bg-secondary"}>
          {invoice.paymentStatus}
        </Badge>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Invoice Date</p>
            <p className="font-medium">{format(new Date(invoice.invoiceDate), 'dd MMM yyyy')}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Due Date</p>
            <p className="font-medium">
              {invoice.dueDate ? format(new Date(invoice.dueDate), 'dd MMM yyyy') : '—'}
            </p>
          </div>
        </div>

        <Separator />

        <div>
          <p className="text-sm font-medium mb-2">Summary</p>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₹{Number(invoice.subtotal).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span>₹{Number(invoice.tax).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-base font-semibold mt-2 pt-2 border-t">
              <span>Total</span>
              <span>₹{Number(invoice.total).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-end gap-2 pt-4 border-t">
        {onView && (
          <Button variant="outline" size="sm" onClick={onView}>
            <ExternalLink className="h-4 w-4 mr-2" />
            View
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={handlePrint} disabled={!invoice.pdfUrl}>
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
        <Button size="sm" onClick={handleDownload} disabled={!invoice.pdfUrl}>
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      </CardFooter>
    </Card>
  )
}
