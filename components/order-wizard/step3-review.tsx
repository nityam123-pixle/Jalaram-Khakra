"use client"

import { useState } from "react"
import { ChevronLeft, CheckCircle2, AlertTriangle, Loader2, ShieldAlert, ArrowRight, WifiOff, RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { SelectedCustomer, OrderItemData } from "./wizard"
import { createOrder, type PriceOverrideApproval } from "@/app/actions/order"
import { formatFriendlyError, type FriendlyErrorInfo } from "@/lib/error-formatter"

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
  const [friendlyError, setFriendlyError] = useState<FriendlyErrorInfo | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryAttempt, setRetryAttempt] = useState(0)
  
  // Price Override Modal State
  const [showOverrideModal, setShowOverrideModal] = useState(false)
  const [approverName, setApproverName] = useState("Owner / Admin")
  const [overrideReason, setOverrideReason] = useState("Selling price is outside the configured pricing policy.")

  const totalRevenue = items.reduce((sum, i) => {
    const qty = Number(i.quantity || 0)
    const price = Number(i.unitSellingPrice || 0)
    const rev = Number(i.totalRevenue)
    return sum + (isNaN(rev) ? qty * price : rev)
  }, 0)

  const totalProfit = items.reduce((sum, i) => {
    const prof = Number(i.totalProfit)
    return sum + (isNaN(prof) ? 0 : prof)
  }, 0)

  // Identify any items that violate the pricing policy
  const priceOverrides = items.filter(item => {
    const min = item.minSellingPrice != null ? Number(item.minSellingPrice) : null
    const max = item.maxSellingPrice != null ? Number(item.maxSellingPrice) : null
    const price = Number(item.unitSellingPrice || 0)
    if (min != null && price < min) return true
    if (max != null && price > max) return true
    return false
  })

  // Basic Validation
  const errors: string[] = []
  if (items.length === 0) errors.push("Order must contain at least one item.")
  if (totalRevenue <= 0) errors.push("Order total revenue must be greater than ₹0.")

  items.forEach((item, i) => {
    if (!item.variantId) errors.push(`Item ${i+1} is missing a product variant.`)
    const qty = Number(item.quantity || 0)
    const price = Number(item.unitSellingPrice || 0)
    if (qty <= 0) errors.push(`Item ${i+1} (${item.productName || "Product"}) has invalid quantity.`)
    if (price <= 0) errors.push(`Item ${i+1} (${item.productName || "Product"}) has invalid pricing.`)
  })

  const isValid = errors.length === 0

  const executeOrderSubmission = async (approval?: PriceOverrideApproval, isManualRetry = false) => {
    setSubmitting(true)
    setFriendlyError(null)

    // Pre-check offline status
    if (typeof window !== "undefined" && typeof navigator !== "undefined" && !navigator.onLine) {
      setFriendlyError(formatFriendlyError(new Error("OFFLINE_NETWORK_ERROR")))
      setSubmitting(false)
      return
    }

    try {
      const orderData = await createOrder({
        customerId: customer.id,
        items: items.map(i => ({
          variantId: i.variantId,
          quantity: Number(i.quantity || 1),
          sellingPrice: Number(i.unitSellingPrice || 0)
        })),
        priceOverrideApproval: approval
      })
      setShowOverrideModal(false)
      onSuccess(orderData)
    } catch (e: any) {
      console.error("[Step3Review] Order submission error:", e)

      // Automatic retry once on transient network glitch if online
      const isFetchError = e?.message?.includes("Failed to fetch") || e?.name === "TypeError"
      if (!isManualRetry && isFetchError && retryAttempt === 0 && typeof window !== "undefined" && navigator.onLine) {
        setRetryAttempt(1)
        setIsRetrying(true)
        setTimeout(() => {
          setIsRetrying(false)
          executeOrderSubmission(approval, true)
        }, 1200)
        return
      }

      setFriendlyError(formatFriendlyError(e))
    } finally {
      setSubmitting(false)
      setIsRetrying(false)
    }
  }

  const handleInitialSubmit = () => {
    if (!isValid) return

    // If there are pricing policy overrides and user hasn't approved them yet, open dialog
    if (priceOverrides.length > 0) {
      setShowOverrideModal(true)
      return
    }

    executeOrderSubmission()
  }

  const handleApproveAndContinue = () => {
    executeOrderSubmission({
      approved: true,
      approvedBy: approverName.trim() || "Owner / Admin",
      reason: overrideReason.trim() || "Special customer price agreement"
    })
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

      {isRetrying && (
        <Alert className="border-blue-500/40 bg-blue-500/10 text-blue-900 dark:text-blue-200">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
          <AlertTitle className="font-semibold">Reconnecting to Server...</AlertTitle>
          <AlertDescription className="text-sm text-blue-800 dark:text-blue-300">
            Network momentarily disconnected. Automatically retrying order creation...
          </AlertDescription>
        </Alert>
      )}

      {friendlyError && (
        <div
          className={`border-2 rounded-2xl p-5 shadow-sm transition-all ${
            friendlyError.isNetworkError
              ? "border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100"
              : "border-red-500/40 bg-red-500/10 text-red-950 dark:text-red-100"
          }`}
        >
          <div className="flex items-start gap-3.5">
            <div
              className={`p-2.5 rounded-xl shrink-0 ${
                friendlyError.isNetworkError
                  ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                  : "bg-red-500/20 text-red-600 dark:text-red-400"
              }`}
            >
              {friendlyError.isNetworkError ? (
                <WifiOff className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h4 className="text-base font-semibold tracking-tight">
                  {friendlyError.title}
                </h4>
                {friendlyError.badgeText && (
                  <Badge
                    variant="outline"
                    className={`text-xs font-medium ${
                      friendlyError.isNetworkError
                        ? "border-amber-500/50 text-amber-700 dark:text-amber-300 bg-amber-500/15"
                        : "border-red-500/50 text-red-700 dark:text-red-300 bg-red-500/15"
                    }`}
                  >
                    {friendlyError.badgeText}
                  </Badge>
                )}
              </div>

              <p className="text-sm opacity-90 leading-relaxed">
                {friendlyError.description}
              </p>

              <div className="pt-2 flex items-center gap-2.5 flex-wrap">
                {friendlyError.isRetryable && (
                  <Button
                    size="sm"
                    variant={friendlyError.isNetworkError ? "default" : "destructive"}
                    disabled={submitting || isRetrying}
                    onClick={() => executeOrderSubmission(undefined, true)}
                    className="gap-2 font-medium shadow-xs"
                  >
                    {submitting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RotateCw className="h-3.5 w-3.5" />
                    )}
                    {friendlyError.actionText || "Retry Submission"}
                  </Button>
                )}

                {friendlyError.title.includes("Customer") && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onBack}
                    className="gap-2"
                  >
                    Back to Step 1
                  </Button>
                )}

                {friendlyError.title.includes("Price") && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowOverrideModal(true)}
                    className="gap-2"
                  >
                    Authorize Price Override
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {priceOverrides.length > 0 && (
        <Alert className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200">
          <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="font-semibold flex items-center gap-2 text-amber-800 dark:text-amber-300">
            Price Policy Overrides Detected ({priceOverrides.length})
          </AlertTitle>
          <AlertDescription className="text-sm text-amber-700 dark:text-amber-300 mt-1">
            {priceOverrides.length === 1 
              ? "1 item has a custom price outside standard policy limits. An approval will be logged on submit."
              : `${priceOverrides.length} items have custom prices outside standard policy limits. Approvals will be logged on submit.`}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4 border-b pb-2">Customer Details</h3>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-3 text-muted-foreground">Shop Name</div>
              <div className="font-medium text-base pb-2">{customer.shop_name || "Unknown Shop"}</div>
              
              <div className="grid grid-cols-3 text-muted-foreground">City</div>
              <div className="font-medium pb-2">{customer.city || "-"}</div>
              
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
                <span className="font-semibold text-2xl">₹{(Number(totalRevenue) || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Projected Profit</span>
                <span className="font-semibold text-emerald-600">₹{(Number(totalProfit) || 0).toFixed(2)}</span>
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
              {items.map(item => {
                const unitPrice = Number(item.unitSellingPrice || 0)
                const rev = Number(item.totalRevenue || (item.quantity * unitPrice) || 0)
                const isOverridden = 
                  (item.minSellingPrice != null && unitPrice < Number(item.minSellingPrice)) ||
                  (item.maxSellingPrice != null && unitPrice > Number(item.maxSellingPrice))

                return (
                  <tr key={item.id} className="hover:bg-muted/20">
                    <td className="px-6 py-4">
                      <div className="font-medium text-base flex items-center gap-2">
                        {item.productName || "Product"}
                        {isOverridden && (
                          <Badge variant="outline" className="text-[10px] border-amber-500/50 text-amber-700 bg-amber-50 dark:bg-amber-950/40">
                            Custom Rate
                          </Badge>
                        )}
                      </div>
                      <div className="text-muted-foreground">{item.variantName || "Default"}</div>
                    </td>
                    <td className="px-6 py-4 text-center font-medium">{item.quantity}</td>
                    <td className="px-6 py-4 text-right text-muted-foreground">
                      <div>₹{unitPrice.toFixed(2)}</div>
                      {(item.minSellingPrice != null || item.maxSellingPrice != null) && (
                        <div className="text-[11px] text-muted-foreground/80">
                          Range: ₹{item.minSellingPrice ?? 0}–₹{item.maxSellingPrice ?? 0}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-base">₹{rev.toFixed(2)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button variant="outline" size="lg" onClick={onBack} disabled={submitting}>Edit Order</Button>
        <Button size="lg" className="min-w-[200px]" disabled={!isValid || submitting} onClick={handleInitialSubmit}>
          {submitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
          {submitting ? "Processing..." : "Confirm & Submit"}
        </Button>
      </div>

      {/* Price Override Warning Dialog */}
      <Dialog open={showOverrideModal} onOpenChange={setShowOverrideModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-6 w-6" />
              <DialogTitle className="text-xl">Price Override Required</DialogTitle>
            </div>
            <DialogDescription className="text-muted-foreground pt-1">
              The following selling prices fall outside the standard business pricing policy:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="divide-y border rounded-lg overflow-hidden bg-muted/20">
              {priceOverrides.map(o => {
                const min = o.minSellingPrice ?? 0
                const max = o.maxSellingPrice ?? 0
                const entered = Number(o.unitSellingPrice || 0)
                const isBelow = o.minSellingPrice != null && entered < min
                const isAbove = o.maxSellingPrice != null && entered > max

                return (
                  <div key={o.id} className="p-3 text-sm space-y-1">
                    <div className="font-semibold text-foreground flex justify-between">
                      <span>{o.productName} ({o.variantName})</span>
                      <Badge variant={isBelow ? "destructive" : "secondary"} className="text-xs">
                        {isBelow ? "Below Minimum" : "Above Maximum"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 text-xs text-muted-foreground pt-1">
                      <div>
                        Entered Price: <span className="font-bold text-foreground">₹{entered.toFixed(2)}</span>
                      </div>
                      <div>
                        Configured Range: <span className="font-medium text-foreground">₹{min} – ₹{max}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <Label htmlFor="approver" className="text-xs font-semibold text-muted-foreground">
                  Approved By
                </Label>
                <Input
                  id="approver"
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  placeholder="Owner / Admin Name"
                  className="mt-1 h-9"
                />
              </div>

              <div>
                <Label htmlFor="reason" className="text-xs font-semibold text-muted-foreground">
                  Override Reason
                </Label>
                <Input
                  id="reason"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g. Special negotiated rate"
                  className="mt-1 h-9"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex sm:justify-between gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowOverrideModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={handleApproveAndContinue}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Approve & Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
