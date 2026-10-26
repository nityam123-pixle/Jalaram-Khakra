"use client"

import { useState, useTransition, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  X,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Package,
  Boxes,
  Clock,
  History as HistoryIcon,
} from "lucide-react"
import {
  updateProductVariantDetails,
  updateProductVariantPricing,
  updateProductVariantInventory,
  deleteProductVariant,
} from "@/app/actions/products"
import type { VariantWorkspaceItem } from "@/app/actions/products"
import { formatCurrency, formatProfitRange, formatMargin } from "@/lib/pricing-utils"
import { toast } from "sonner"

interface ProductDetailsInspectorProps {
  variant: VariantWorkspaceItem | null
  categories: Array<{ id: string; name: string }>
  onClose: () => void
  onRefreshData: () => Promise<void>
  activeTab?: "details" | "pricing" | "inventory" | "history"
  onTabChange?: (tab: "details" | "pricing" | "inventory" | "history") => void
}

export function ProductDetailsInspector({
  variant,
  categories,
  onClose,
  onRefreshData,
  activeTab = "details",
  onTabChange,
}: ProductDetailsInspectorProps) {
  const [currentTab, setCurrentTab] = useState<"details" | "pricing" | "inventory" | "history">(activeTab)
  const [isPending, startTransition] = useTransition()

  // Form states for Tab 1 (Details)
  const [productName, setProductName] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [variantName, setVariantName] = useState("")
  const [packSize, setPackSize] = useState("")
  const [unitType, setUnitType] = useState<"KG" | "PACKET" | "BOX">("PACKET")
  const [sku, setSku] = useState("")

  // Form states for Tab 2 (Pricing)
  const [costPrice, setCostPrice] = useState<number>(0)
  const [minSellPrice, setMinSellPrice] = useState<number>(0)
  const [maxSellPrice, setMaxSellPrice] = useState<number>(0)
  const [pricingType, setPricingType] = useState<"FIXED" | "RANGE" | "MRP">("FIXED")
  const [priceChangeReason, setPriceChangeReason] = useState("")

  // Form states for Tab 3 (Inventory)
  const [availableStock, setAvailableStock] = useState<number>(0)
  const [reorderPoint, setReorderPoint] = useState<number>(10)
  const [inventoryTracked, setInventoryTracked] = useState<boolean>(false)

  // Sync state when variant changes
  useEffect(() => {
    if (variant) {
      setProductName(variant.product.name)
      setCategoryId(variant.product.categoryId)
      setVariantName(variant.name)
      setPackSize(variant.packSize)
      setUnitType(variant.unitType)
      setSku(variant.sku || "")

      setCostPrice(variant.pricing?.costPrice ?? 0)
      setMinSellPrice(variant.pricing?.minSellingPrice ?? 0)
      setMaxSellPrice(variant.pricing?.maxSellingPrice ?? 0)
      setPricingType(variant.pricing?.pricingType ?? "FIXED")

      setAvailableStock(variant.inventory?.availableStock ?? 0)
      setReorderPoint(variant.inventory?.reorderPoint ?? 10)
      setInventoryTracked(variant.inventoryTracked)
    }
  }, [variant])

  useEffect(() => {
    if (activeTab) {
      setCurrentTab(activeTab)
    }
  }, [activeTab])

  const handleTabSwitch = (tab: "details" | "pricing" | "inventory" | "history") => {
    setCurrentTab(tab)
    onTabChange?.(tab)
  }

  if (!variant) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center border border-border/80 rounded-xl bg-card">
        <Package className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <h3 className="text-sm font-semibold text-foreground">No variant selected</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
          Select any product or variant from the table to view its full details, pricing, and inventory.
        </p>
      </div>
    )
  }

  // Live computed pricing for Tab 2 preview
  const previewCost = Number(costPrice) || 0
  const previewMin = Number(minSellPrice) || 0
  const previewMax = Number(maxSellPrice) || previewMin
  const previewProfitMin = Math.round((previewMin - previewCost + Number.EPSILON) * 100) / 100
  const previewProfitMax = Math.round((previewMax - previewCost + Number.EPSILON) * 100) / 100
  const previewMarginMin = previewMin > 0 ? Math.round((((previewMin - previewCost) / previewMin) * 100) * 10) / 10 : 0
  const previewMarginMax = previewMax > 0 ? Math.round((((previewMax - previewCost) / previewMax) * 100) * 10) / 10 : 0

  // 1. Save Details Handler
  const handleSaveDetails = () => {
    if (!productName.trim() || !variantName.trim()) {
      toast.error("Product name and variant name are required")
      return
    }

    startTransition(async () => {
      try {
        await updateProductVariantDetails(variant.id, {
          productName,
          categoryId,
          variantName,
          unitType,
          sku: sku.trim() || null,
        })
        toast.success("Product details updated successfully")
        await onRefreshData()
      } catch (err: any) {
        toast.error(err?.message || "Failed to update details")
      }
    })
  }

  // 2. Save Pricing Handler
  const handleSavePricing = () => {
    if (costPrice <= 0) {
      toast.error("Cost price must be greater than zero")
      return
    }
    if (minSellPrice < costPrice) {
      toast.warning("Minimum selling price is lower than cost price (negative margin)")
    }
    if (maxSellPrice < minSellPrice) {
      toast.error("Maximum selling price cannot be lower than minimum selling price")
      return
    }

    startTransition(async () => {
      try {
        await updateProductVariantPricing(variant.id, {
          costPrice,
          minSellingPrice: minSellPrice,
          maxSellingPrice: maxSellPrice,
          pricingType,
          reason: priceChangeReason.trim() || undefined,
        })
        toast.success("Pricing updated successfully")
        setPriceChangeReason("")
        await onRefreshData()
      } catch (err: any) {
        toast.error(err?.message || "Failed to update pricing")
      }
    })
  }

  // 3. Save Inventory Handler
  const handleSaveInventory = () => {
    startTransition(async () => {
      try {
        await updateProductVariantInventory(variant.id, {
          availableStock: Number(availableStock) || 0,
          reorderPoint: Number(reorderPoint) || 10,
          inventoryTracked,
        })
        toast.success("Inventory updated successfully")
        await onRefreshData()
      } catch (err: any) {
        toast.error(err?.message || "Failed to update inventory")
      }
    })
  }

  // 4. Delete Variant Handler
  const handleDeleteVariant = async () => {
    startTransition(async () => {
      try {
        await deleteProductVariant(variant.id)
        toast.success("Variant deleted successfully")
        onClose()
        await onRefreshData()
      } catch (err: any) {
        toast.error(err?.message || "Failed to delete variant")
      }
    })
  }

  return (
    <div className="flex flex-col border border-border/80 bg-card rounded-xl shadow-2xs overflow-hidden w-full h-full">
      {/* Inspector Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
        <h2 className="text-base font-bold text-foreground font-sans">
          Product Details
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close inspector</span>
        </Button>
      </div>

      {/* 4 Tabs Navigation Bar */}
      <div className="flex items-center px-4 border-b border-border bg-muted/20">
        {(["details", "pricing", "inventory", "history"] as const).map((tab) => {
          const isActive = currentTab === tab
          return (
            <button
              key={tab}
              type="button"
              onClick={() => handleTabSwitch(tab)}
              className={`capitalize px-3 py-2.5 text-xs font-medium border-b-2 transition-colors relative ${
                isActive
                  ? "border-foreground text-foreground font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          )
        })}
      </div>

      {/* Inspector Body Content */}
      <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-5 text-xs">
        {/* ======================================================== */}
        {/* TAB 1: DETAILS */}
        {/* ======================================================== */}
        {currentTab === "details" && (
          <div className="space-y-4">
            {/* Product Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Product Name
              </Label>
              <Input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Bajri Lasan"
                className="h-8.5 text-xs bg-background dark:bg-zinc-900 border-border"
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Category
              </Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="h-8.5 text-xs bg-background dark:bg-zinc-900 border-border">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent className="max-h-56 bg-popover border-border">
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Variant Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Variant Name
              </Label>
              <Input
                value={variantName}
                onChange={(e) => setVariantName(e.target.value)}
                placeholder="e.g. 200g Packet"
                className="h-8.5 text-xs bg-background dark:bg-zinc-900 border-border"
              />
            </div>

            {/* Pack Size + Unit Type */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Pack Size
                </Label>
                <Input
                  value={packSize}
                  onChange={(e) => setPackSize(e.target.value)}
                  placeholder="e.g. 200g"
                  className="h-8.5 text-xs bg-background dark:bg-zinc-900 border-border"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Unit
                </Label>
                <Select
                  value={unitType}
                  onValueChange={(val: "KG" | "PACKET" | "BOX") => setUnitType(val)}
                >
                  <SelectTrigger className="h-8.5 text-xs bg-background dark:bg-zinc-900 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="PACKET" className="text-xs">Packet</SelectItem>
                    <SelectItem value="KG" className="text-xs">KG</SelectItem>
                    <SelectItem value="BOX" className="text-xs">Box</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* SKU (Optional) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                SKU (Optional)
              </Label>
              <Input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. BL-200"
                className="h-8.5 text-xs bg-background dark:bg-zinc-900 border-border"
              />
            </div>

            {/* Save Details Button */}
            <Button
              size="sm"
              onClick={handleSaveDetails}
              disabled={isPending}
              className="w-full h-8 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold text-xs"
            >
              {isPending ? "Saving..." : "Save Details"}
            </Button>

            {/* Sub-section: Pricing Snapshot */}
            <div className="pt-4 border-t border-border space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-foreground">Pricing</h3>
                <button
                  type="button"
                  onClick={() => handleTabSwitch("pricing")}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="h-3 w-3" />
                  <span>Edit</span>
                </button>
              </div>

              <div className="space-y-2 py-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Cost Price</span>
                  <span className="font-mono font-medium text-foreground">
                    {formatCurrency(variant.pricing?.costPrice)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Minimum Sell Price</span>
                  <span className="font-mono font-medium text-foreground">
                    {formatCurrency(variant.pricing?.minSellingPrice)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Maximum Sell Price</span>
                  <span className="font-mono font-medium text-foreground">
                    {formatCurrency(variant.pricing?.maxSellingPrice)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Profit Range</span>
                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatProfitRange(variant.profitMin, variant.profitMax)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Margin Range</span>
                  <span className="font-mono font-medium text-foreground">
                    {formatMargin(variant.marginMin)} – {formatMargin(variant.marginMax)}
                  </span>
                </div>
              </div>

              {/* Health Banner */}
              {variant.healthStatus === "Good" && (
                <div className="flex items-center gap-2.5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="font-semibold text-xs leading-none">Pricing looks good</p>
                    <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
                      Margin is within healthy range.
                    </p>
                  </div>
                </div>
              )}
              {variant.healthStatus === "Low" && (
                <div className="flex items-center gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <div>
                    <p className="font-semibold text-xs leading-none">Low Margin Alert</p>
                    <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-0.5">
                      Margin is between 5% and 20%.
                    </p>
                  </div>
                </div>
              )}
              {variant.healthStatus === "Issue" && (
                <div className="flex items-center gap-2.5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  <div>
                    <p className="font-semibold text-xs leading-none">Pricing Issue</p>
                    <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80 mt-0.5">
                      Cost exceeds selling price or price missing.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Sub-section: Inventory Snapshot */}
            <div className="pt-4 border-t border-border space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-foreground">Inventory</h3>
                <button
                  type="button"
                  onClick={() => handleTabSwitch("inventory")}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="h-3 w-3" />
                  <span>Manage</span>
                </button>
              </div>

              <div className="space-y-2 py-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Boxes className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Current Stock</span>
                  </div>
                  <span className="font-mono font-medium text-foreground">
                    {variant.inventory?.availableStock ?? 0} {variant.unitType === "KG" ? "kg" : "packets"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Low Stock Alert</span>
                  </div>
                  <span className="font-mono font-medium text-foreground">
                    {variant.inventory?.reorderPoint ?? 10} {variant.unitType === "KG" ? "kg" : "packets"}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Action: Delete Variant */}
            <div className="pt-4 border-t border-border">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-xs text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Variant</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-popover border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-foreground">Delete this variant?</AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground text-xs">
                      Are you sure you want to delete {variant.product.name} ({variant.name})?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteVariant}
                      className="bg-rose-600 text-white hover:bg-rose-700 text-xs font-semibold"
                    >
                      Confirm Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: PRICING */}
        {/* ======================================================== */}
        {currentTab === "pricing" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="font-bold text-xs text-foreground">Edit Pricing Rules</h3>
              <p className="text-[11px] text-muted-foreground">
                Set cost and selling boundaries for {variant.product.name} ({variant.name}).
              </p>
            </div>

            {/* Cost Price */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Cost Price (₹)</Label>
              <Input
                type="number"
                step="any"
                value={costPrice}
                onChange={(e) => setCostPrice(Number(e.target.value))}
                className="h-8.5 font-mono text-xs bg-background dark:bg-zinc-900 border-border"
              />
            </div>

            {/* Minimum Sell Price */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Minimum Selling Price (₹)</Label>
              <Input
                type="number"
                step="any"
                value={minSellPrice}
                onChange={(e) => setMinSellPrice(Number(e.target.value))}
                className="h-8.5 font-mono text-xs bg-background dark:bg-zinc-900 border-border"
              />
            </div>

            {/* Maximum Sell Price */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Maximum Selling Price (₹)</Label>
              <Input
                type="number"
                step="any"
                value={maxSellPrice}
                onChange={(e) => setMaxSellPrice(Number(e.target.value))}
                className="h-8.5 font-mono text-xs bg-background dark:bg-zinc-900 border-border"
              />
            </div>

            {/* Pricing Type */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Pricing Model</Label>
              <Select
                value={pricingType}
                onValueChange={(val: "FIXED" | "RANGE" | "MRP") => setPricingType(val)}
              >
                <SelectTrigger className="h-8.5 text-xs bg-background dark:bg-zinc-900 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="FIXED" className="text-xs">Fixed Price</SelectItem>
                  <SelectItem value="RANGE" className="text-xs">Price Range</SelectItem>
                  <SelectItem value="MRP" className="text-xs">MRP Controlled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Change Reason / Audit Note */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Reason for update (Optional)</Label>
              <Input
                value={priceChangeReason}
                onChange={(e) => setPriceChangeReason(e.target.value)}
                placeholder="e.g. Raw material cost increase"
                className="h-8.5 text-xs bg-background dark:bg-zinc-900 border-border"
              />
            </div>

            {/* Live Calculation Preview Card */}
            <div className="p-3 rounded-lg border border-border/80 bg-muted/40 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Computed Profit Range:</span>
                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatProfitRange(previewProfitMin, previewProfitMax)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Computed Margin Range:</span>
                <span className="font-mono font-semibold text-foreground">
                  {formatMargin(previewMarginMin)} – {formatMargin(previewMarginMax)}
                </span>
              </div>
            </div>

            {/* Save Pricing Button */}
            <Button
              size="sm"
              onClick={handleSavePricing}
              disabled={isPending}
              className="w-full h-8 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold text-xs"
            >
              {isPending ? "Updating Pricing..." : "Save Pricing"}
            </Button>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: INVENTORY */}
        {/* ======================================================== */}
        {currentTab === "inventory" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="font-bold text-xs text-foreground">Inventory Levels</h3>
              <p className="text-[11px] text-muted-foreground">
                Manage live stock and low-stock threshold triggers.
              </p>
            </div>

            {/* Available Stock */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Available Stock Units</Label>
              <Input
                type="number"
                value={availableStock}
                onChange={(e) => setAvailableStock(Number(e.target.value))}
                className="h-8.5 font-mono text-xs bg-background dark:bg-zinc-900 border-border"
              />
            </div>

            {/* Low Stock Alert Threshold */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Low Stock Threshold</Label>
              <Input
                type="number"
                value={reorderPoint}
                onChange={(e) => setReorderPoint(Number(e.target.value))}
                className="h-8.5 font-mono text-xs bg-background dark:bg-zinc-900 border-border"
              />
            </div>

            {/* Inventory Tracked Switch */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/80 bg-muted/30">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold text-foreground">Track Stock Automatically</Label>
                <p className="text-[10px] text-muted-foreground">
                  Deduct inventory automatically when orders are dispatched.
                </p>
              </div>
              <Switch
                checked={inventoryTracked}
                onCheckedChange={setInventoryTracked}
              />
            </div>

            {/* Save Inventory Button */}
            <Button
              size="sm"
              onClick={handleSaveInventory}
              disabled={isPending}
              className="w-full h-8 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold text-xs"
            >
              {isPending ? "Updating Stock..." : "Save Inventory"}
            </Button>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: HISTORY */}
        {/* ======================================================== */}
        {currentTab === "history" && (
          <div className="space-y-3">
            <div className="space-y-1">
              <h3 className="font-bold text-xs text-foreground">Pricing &amp; Audit History</h3>
              <p className="text-[11px] text-muted-foreground">
                Historical record of pricing modifications for this variant.
              </p>
            </div>

            {variant.pricingHistory.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground border border-dashed border-border rounded-lg p-4">
                <HistoryIcon className="h-6 w-6 mx-auto mb-2 text-muted-foreground/40" />
                <p className="text-xs font-medium text-foreground">No historical changes yet</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Any price updates will automatically appear here with timestamps.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {variant.pricingHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg border border-border/70 bg-muted/30 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground font-mono">
                        Cost: ₹{item.costPrice} · Sell: ₹{item.minSellingPrice ?? "-"}–₹{item.maxSellingPrice ?? "-"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(item.effectiveFrom).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </span>
                    </div>
                    {item.correctionReason && (
                      <p className="text-[11px] text-muted-foreground italic">
                        &quot;{item.correctionReason}&quot;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
