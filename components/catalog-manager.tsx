"use client"
import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updatePricing, createProductWithVariant } from "@/app/actions/catalog"
import { ChevronLeft, ChevronRight, Plus, Package, Tag, Layers } from "lucide-react"

const PAGE_SIZE = 10

export function CatalogManager({ catalogData }: { catalogData: any[] }) {
  // ── Edit Pricing State ──────────────────────────────────────────────────────
  const [editingVariant, setEditingVariant] = useState<any | null>(null)
  const [costPrice, setCostPrice]   = useState("")
  const [minPrice,  setMinPrice]    = useState("")
  const [maxPrice,  setMaxPrice]    = useState("")
  const [saving, setSaving]         = useState(false)

  // ── Create Product State ────────────────────────────────────────────────────
  const [createOpen, setCreateOpen]           = useState(false)
  const [newName, setNewName]                 = useState("")
  const [newCategoryId, setNewCategoryId]     = useState("")
  const [newVariantName, setNewVariantName]   = useState("1kg")
  const [newUnitType, setNewUnitType]         = useState<"KG"|"PACKET"|"BOX">("KG")
  const [newCost, setNewCost]                 = useState("")
  const [newMinSell, setNewMinSell]           = useState("")
  const [newMaxSell, setNewMaxSell]           = useState("")
  const [creating, setCreating]               = useState(false)
  const [createError, setCreateError]         = useState("")

  // ── Pagination ──────────────────────────────────────────────────────────────
  const [page, setPage] = useState(1)

  // ── Flatten rows ─────────────────────────────────────────────────────────
  const rows = useMemo(() => {
    const r: any[] = []
    catalogData.forEach(cat => {
      cat.products.forEach((prod: any) => {
        prod.variants.forEach((v: any) => {
          r.push({
            category:    cat.name,
            categoryId:  cat.id,
            product:     prod.name,
            variantId:   v.id,
            variantName: v.name,
            unitType:    v.unitType,
            pricing:     v.pricingRules?.[0],
            rawVariant:  v,
          })
        })
      })
    })
    return r
  }, [catalogData])

  const totalPages  = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const pageRows    = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleEditClick = (row: any) => {
    setEditingVariant(row)
    setCostPrice(row.pricing?.costPrice?.toString() ?? "")
    setMinPrice(row.pricing?.minSellingPrice?.toString() ?? "")
    setMaxPrice(row.pricing?.maxSellingPrice?.toString() ?? "")
  }

  const handleSavePricing = async () => {
    if (!editingVariant) return
    setSaving(true)
    try {
      await updatePricing(editingVariant.variantId, {
        costPrice:       Number(costPrice),
        minSellingPrice: Number(minPrice),
        maxSellingPrice: Number(maxPrice),
      })
      setEditingVariant(null)
      window.location.reload()
    } finally {
      setSaving(false)
    }
  }

  const handleCreateProduct = async () => {
    if (!newName.trim() || !newCategoryId) {
      setCreateError("Product name and category are required.")
      return
    }
    setCreateError("")
    setCreating(true)
    try {
      await createProductWithVariant({
        name:            newName.trim(),
        categoryId:      newCategoryId,
        variantName:     newVariantName || "1kg",
        unitType:        newUnitType,
        costPrice:       Number(newCost)    || 0,
        minSellingPrice: Number(newMinSell) || 0,
        maxSellingPrice: Number(newMaxSell) || 0,
      })
      setCreateOpen(false)
      setNewName(""); setNewCategoryId(""); setNewVariantName("1kg")
      setNewUnitType("KG"); setNewCost(""); setNewMinSell(""); setNewMaxSell("")
      window.location.reload()
    } catch (e: any) {
      setCreateError(e.message || "Failed to create product")
    } finally {
      setCreating(false)
    }
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalProducts = useMemo(
    () => catalogData.reduce((s, c) => s + c.products.length, 0),
    [catalogData]
  )

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
          <div className="p-2.5 bg-muted rounded-lg">
            <Layers className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Categories</p>
            <h3 className="text-2xl font-bold text-foreground">{catalogData.length}</h3>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
          <div className="p-2.5 bg-muted rounded-lg">
            <Package className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Products</p>
            <h3 className="text-2xl font-bold text-foreground">{totalProducts}</h3>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
          <div className="p-2.5 bg-muted rounded-lg">
            <Tag className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Variants</p>
            <h3 className="text-2xl font-bold text-foreground">{rows.length}</h3>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, rows.length)} of {rows.length} variants
        </p>

        {/* Create Product Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Product</DialogTitle>
              <DialogDescription>
                Add a product with its first variant and pricing in one step.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-1.5">
                <Label>Category *</Label>
                <Select value={newCategoryId} onValueChange={setNewCategoryId}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="Select category…" />
                  </SelectTrigger>
                  <SelectContent>
                    {catalogData.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Product Name *</Label>
                <Input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Dahi Methi"
                  className="bg-background border-border"
                />
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-sm font-medium text-foreground mb-3">First Variant</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label>Variant Name</Label>
                    <Input
                      value={newVariantName}
                      onChange={e => setNewVariantName(e.target.value)}
                      placeholder="1kg / 200g / 1pkt"
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Unit Type</Label>
                    <Select value={newUnitType} onValueChange={v => setNewUnitType(v as any)}>
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KG">KG</SelectItem>
                        <SelectItem value="PACKET">Packet</SelectItem>
                        <SelectItem value="BOX">Box</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-sm font-medium text-foreground mb-3">Pricing (₹)</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="grid gap-1.5">
                    <Label>Cost</Label>
                    <Input type="number" value={newCost} onChange={e => setNewCost(e.target.value)} placeholder="195" className="bg-background border-border" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Min Sell</Label>
                    <Input type="number" value={newMinSell} onChange={e => setNewMinSell(e.target.value)} placeholder="195" className="bg-background border-border" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Max Sell</Label>
                    <Input type="number" value={newMaxSell} onChange={e => setNewMaxSell(e.target.value)} placeholder="220" className="bg-background border-border" />
                  </div>
                </div>
              </div>

              {createError && (
                <p className="text-sm text-destructive">{createError}</p>
              )}

              <Button onClick={handleCreateProduct} disabled={creating} className="w-full mt-2">
                {creating ? "Creating…" : "Create Product"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-muted-foreground font-medium">Category</TableHead>
              <TableHead className="text-muted-foreground font-medium">Product</TableHead>
              <TableHead className="text-muted-foreground font-medium">Variant</TableHead>
              <TableHead className="text-right text-muted-foreground font-medium">Cost ₹</TableHead>
              <TableHead className="text-right text-muted-foreground font-medium">Min Sell ₹</TableHead>
              <TableHead className="text-right text-muted-foreground font-medium">Max Sell ₹</TableHead>
              <TableHead className="text-right text-muted-foreground font-medium">Profit ₹</TableHead>
              <TableHead className="w-28"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((r, i) => {
              const profit = r.pricing
                ? `${(r.pricing.minSellingPrice - r.pricing.costPrice).toFixed(0)}–${(r.pricing.maxSellingPrice - r.pricing.costPrice).toFixed(0)}`
                : "—"
              return (
                <TableRow key={i} className="hover:bg-muted/20 transition-colors border-border">
                  <TableCell className="text-muted-foreground text-sm">{r.category}</TableCell>
                  <TableCell className="font-medium text-foreground">{r.product}</TableCell>
                  <TableCell className="text-foreground">
                    <Badge variant="secondary" className="font-normal">{r.variantName}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-foreground tabular-nums">
                    {r.pricing ? `₹${r.pricing.costPrice}` : <Badge variant="destructive" className="text-xs">N/A</Badge>}
                  </TableCell>
                  <TableCell className="text-right text-foreground tabular-nums">
                    {r.pricing?.minSellingPrice != null ? `₹${r.pricing.minSellingPrice}` : "—"}
                  </TableCell>
                  <TableCell className="text-right text-foreground tabular-nums">
                    {r.pricing?.maxSellingPrice != null ? `₹${r.pricing.maxSellingPrice}` : "—"}
                  </TableCell>
                  <TableCell className="text-right text-emerald-600 font-medium tabular-nums text-sm">
                    {r.pricing ? `₹${profit}` : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {/* Edit Pricing Dialog */}
                    <Dialog
                      open={editingVariant?.variantId === r.variantId}
                      onOpenChange={open => { if (!open) setEditingVariant(null) }}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => handleEditClick(r)} className="text-xs h-8">
                          Edit Pricing
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Pricing</DialogTitle>
                          <DialogDescription>
                            {r.product} · {r.variantName}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label>Cost Price (₹)</Label>
                            <Input type="number" value={costPrice} onChange={e => setCostPrice(e.target.value)} className="bg-background border-border" />
                          </div>
                          <div className="grid gap-2">
                            <Label>Min Selling Price (₹)</Label>
                            <Input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="bg-background border-border" />
                          </div>
                          <div className="grid gap-2">
                            <Label>Max Selling Price (₹)</Label>
                            <Input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="bg-background border-border" />
                          </div>
                          {Number(minPrice) > 0 && Number(costPrice) > 0 && (
                            <div className="rounded-lg bg-muted/40 p-3 text-sm">
                              <span className="text-muted-foreground">Profit range: </span>
                              <span className="font-semibold text-emerald-600">
                                ₹{(Number(minPrice) - Number(costPrice)).toFixed(2)} – ₹{(Number(maxPrice) - Number(costPrice)).toFixed(2)}
                              </span>
                            </div>
                          )}
                          <Button onClick={handleSavePricing} disabled={saving} className="w-full mt-2">
                            {saving ? "Saving…" : "Save Changes"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="gap-1 h-8"
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </Button>
          {/* Page number pills */}
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | string)[]>((acc, p, idx, arr) => {
                if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("…")
                acc.push(p)
                return acc
              }, [])
              .map((p, i) =>
                p === "…" ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground text-sm flex items-center">…</span>
                ) : (
                  <Button
                    key={p}
                    variant={p === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(p as number)}
                    className="h-8 w-8 p-0 text-xs"
                  >
                    {p}
                  </Button>
                )
              )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="gap-1 h-8"
          >
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
