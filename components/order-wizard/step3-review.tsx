"use client"

import { useState } from "react"
import { ChevronLeft, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { SelectedCustomer, OrderItemData } from "./wizard"
import { createOrder } from "@/app/actions/order"

export function Step3Review({
  customer,
  items,
  onBack,
  onSuccess
}: {
  customer: SelectedCustomer
  items: OrderItemData[]
  onBack: () => void
  onSuccess: (orderData: any) => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalRevenue = items.reduce((sum, i) => sum + i.totalRevenue, 0)
  const totalProfit = items.reduce((sum, i) => sum + i.totalProfit, 0)

  // Validation
  const errors: string[] = []
  if (items.length === 0) errors.push("Order must contain at least one item.")
  if (totalRevenue <= 0) errors.push("Order total revenue must be greater than ₹0.")

  items.forEach((item, i) => {
    if (!item.variantId) errors.push(`Item ${i+1} is missing a product variant.`)
    if (item.quantity <= 0) errors.push(`Item ${i+1} (${item.productName}) has invalid quantity.`)
    if (item.unitSellingPrice <= 0) errors.push(`Item ${i+1} (${item.productName}) has invalid pricing.`)
    // Could add min/max selling price validation here if we had the rules
  })

  const isValid = errors.length === 0

  const handleSubmit = async () => {
    if (!isValid) return
    setSubmitting(true)
    setError(null)
    try {
      const orderData = await createOrder({
        customerId: customer.id,
        items: items.map(i => ({
          variantId: i.variantId,
          quantity: i.quantity,
          sellingPrice: i.unitSellingPrice
        }))
      })
      onSuccess(orderData)
    } catch (e: any) {
      setError(e.message || "Failed to create order. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} disabled={submitting}><ChevronLeft className="w-5 h-5" /></Button>
        <div>
          <h2 className="text-2xl font-semibold">Review Order</h2>
          <p className="text-sm text-muted-foreground">Please confirm all details before submitting</p>
        </div>
      </div>

      {!isValid && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Validation Errors</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Submission Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4 border-b pb-2">Customer Details</h3>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-3 text-muted-foreground">Shop Name</div>
              <div className="font-medium text-base pb-2">{customer.shop_name}</div>
              
              <div className="grid grid-cols-3 text-muted-foreground">City</div>
              <div className="font-medium pb-2">{customer.city}</div>
              
              <div className="grid grid-cols-3 text-muted-foreground">Phone</div>
              <div className="font-medium pb-2">{customer.phone || "-"}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 bg-muted/40 h-full">
            <h3 className="font-semibold text-lg mb-4 border-b pb-2">Order Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-lg">
                <span className="text-muted-foreground">Total Items</span>
                <span className="font-semibold">{items.length}</span>
              </div>
              <div className="flex justify-between items-center text-lg">
                <span className="text-muted-foreground">Total Revenue</span>
                <span className="font-semibold text-2xl">₹{totalRevenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Projected Profit</span>
                <span className="font-semibold text-emerald-600">₹{totalProfit.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium rounded-tl-xl">Product</th>
                <th className="px-6 py-4 font-medium text-center">Qty</th>
                <th className="px-6 py-4 font-medium text-right">Price</th>
                <th className="px-6 py-4 font-medium text-right rounded-tr-xl">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-muted/20">
                  <td className="px-6 py-4">
                    <div className="font-medium text-base">{item.productName}</div>
                    <div className="text-muted-foreground">{item.variantName}</div>
                  </td>
                  <td className="px-6 py-4 text-center font-medium">{item.quantity}</td>
                  <td className="px-6 py-4 text-right text-muted-foreground">₹{item.unitSellingPrice.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right font-semibold text-base">₹{item.totalRevenue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button variant="outline" size="lg" onClick={onBack} disabled={submitting}>Edit Order</Button>
        <Button size="lg" className="min-w-[200px]" disabled={!isValid || submitting} onClick={handleSubmit}>
          {submitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
          {submitting ? "Processing..." : "Confirm & Submit"}
        </Button>
      </div>
    </div>
  )
}
