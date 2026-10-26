"use client"

import { useState, useTransition } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createNewProductWithVariant } from "@/app/actions/products"
import { toast } from "sonner"

interface AddProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Array<{ id: string; name: string }>
  onSuccess: (newVariantId?: string) => Promise<void>
}

export function AddProductDialog({
  open,
  onOpenChange,
  categories,
  onSuccess,
}: AddProductDialogProps) {
  const [productName, setProductName] = useState("")
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "")
  const [variantName, setVariantName] = useState("200g Packet")
  const [unitType, setUnitType] = useState<"KG" | "PACKET" | "BOX">("PACKET")
  const [sku, setSku] = useState("")
  const [costPrice, setCostPrice] = useState<string>("")
  const [minSellingPrice, setMinSellingPrice] = useState<string>("")
  const [maxSellingPrice, setMaxSellingPrice] = useState<string>("")
  const [initialStock, setInitialStock] = useState<string>("")
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!productName.trim()) {
      toast.error("Please enter a product name")
      return
    }
    if (!categoryId) {
      toast.error("Please select a category")
      return
    }
    if (!variantName.trim()) {
      toast.error("Please enter a variant name")
      return
    }

    const cost = parseFloat(costPrice)
    const minSell = parseFloat(minSellingPrice)
    const maxSell = parseFloat(maxSellingPrice || minSellingPrice)

    if (isNaN(cost) || cost <= 0) {
      toast.error("Cost price must be greater than 0")
      return
    }
    if (isNaN(minSell) || minSell <= 0) {
      toast.error("Minimum selling price must be greater than 0")
      return
    }
    if (maxSell < minSell) {
      toast.error("Maximum selling price cannot be lower than minimum selling price")
      return
    }

    startTransition(async () => {
      try {
        const result = await createNewProductWithVariant({
          productName: productName.trim(),
          categoryId,
          variantName: variantName.trim(),
          sku: sku.trim() || undefined,
          unitType,
          costPrice: cost,
          minSellingPrice: minSell,
          maxSellingPrice: maxSell,
          initialStock: initialStock ? parseInt(initialStock, 10) : undefined,
        })

        toast.success(`Product "${productName}" created successfully!`)
        onOpenChange(false)
        // Reset form
        setProductName("")
        setVariantName("200g Packet")
        setSku("")
        setCostPrice("")
        setMinSellingPrice("")
        setMaxSellingPrice("")
        setInitialStock("")

        await onSuccess(result?.variant?.id)
      } catch (err: any) {
        toast.error(err?.message || "Failed to create product")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              Add New Product &amp; Variant
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Create a new catalog item with its base pricing and variant rules.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 text-xs py-1">
            {/* Product Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Product Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Masala Khakhra"
                className="h-8.5 text-xs bg-background dark:bg-zinc-900 border-border"
                required
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Category <span className="text-rose-500">*</span>
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

            {/* Variant Name & Unit */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Variant Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={variantName}
                  onChange={(e) => setVariantName(e.target.value)}
                  placeholder="e.g. 200g Packet"
                  className="h-8.5 text-xs bg-background dark:bg-zinc-900 border-border"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Unit Type
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

            {/* Pricing: Cost, Min Sell, Max Sell */}
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Cost (₹) <span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="number"
                  step="any"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  placeholder="39"
                  className="h-8.5 font-mono text-xs bg-background dark:bg-zinc-900 border-border"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Min Sell (₹) <span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="number"
                  step="any"
                  value={minSellingPrice}
                  onChange={(e) => setMinSellingPrice(e.target.value)}
                  placeholder="44"
                  className="h-8.5 font-mono text-xs bg-background dark:bg-zinc-900 border-border"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Max Sell (₹)
                </Label>
                <Input
                  type="number"
                  step="any"
                  value={maxSellingPrice}
                  onChange={(e) => setMaxSellingPrice(e.target.value)}
                  placeholder="50"
                  className="h-8.5 font-mono text-xs bg-background dark:bg-zinc-900 border-border"
                />
              </div>
            </div>

            {/* SKU and Initial Stock */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  SKU (Optional)
                </Label>
                <Input
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="e.g. MK-200"
                  className="h-8.5 text-xs bg-background dark:bg-zinc-900 border-border"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Initial Stock (Optional)
                </Label>
                <Input
                  type="number"
                  value={initialStock}
                  onChange={(e) => setInitialStock(e.target.value)}
                  placeholder="e.g. 100"
                  className="h-8.5 font-mono text-xs bg-background dark:bg-zinc-900 border-border"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs border-border"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold text-xs"
            >
              {isPending ? "Creating..." : "Create Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
