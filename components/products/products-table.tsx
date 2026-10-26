"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MoreVertical, ChevronLeft, ChevronRight, Eye, Pencil, Trash2 } from "lucide-react"
import type { VariantWorkspaceItem } from "@/app/actions/products"
import { formatCurrency, formatProfitRange, formatMargin } from "@/lib/pricing-utils"

interface ProductsTableProps {
  variants: VariantWorkspaceItem[]
  totalCount: number
  currentPage: number
  pageSize: number
  onPageChange: (page: number) => void
  selectedVariant: VariantWorkspaceItem | null
  onSelectVariant: (variant: VariantWorkspaceItem) => void
  onOpenPricingEdit?: (variant: VariantWorkspaceItem) => void
  onDeleteVariant: (variantId: string) => Promise<void>
}

export function ProductsTable({
  variants,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  selectedVariant,
  onSelectVariant,
  onOpenPricingEdit,
  onDeleteVariant,
}: ProductsTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [variantToDelete, setVariantToDelete] = useState<VariantWorkspaceItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const startIndex = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endIndex = Math.min(currentPage * pageSize, totalCount)

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(variants.map((v) => v.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleDeleteConfirm = async () => {
    if (!variantToDelete) return
    setIsDeleting(true)
    try {
      await onDeleteVariant(variantToDelete.id)
      setVariantToDelete(null)
    } finally {
      setIsDeleting(false)
    }
  }

  // Generate pagination page numbers
  const getPaginationItems = () => {
    const items: (number | string)[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) items.push(i)
    } else {
      if (currentPage <= 4) {
        items.push(1, 2, 3, 4, 5, "...", totalPages)
      } else if (currentPage >= totalPages - 3) {
        items.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        items.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages)
      }
    }
    return items
  }

  const isAllSelected = variants.length > 0 && variants.every((v) => selectedIds.has(v.id))
  const isSomeSelected = variants.some((v) => selectedIds.has(v.id)) && !isAllSelected

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Table Shell */}
      <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <Table className="w-full text-xs">
            <TableHeader className="bg-muted/30 dark:bg-zinc-900/60 border-b border-border">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10 px-3 text-center">
                  <Checkbox
                    checked={isAllSelected ? true : isSomeSelected ? "indeterminate" : false}
                    onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                    aria-label="Select all rows"
                    className="h-3.5 w-3.5"
                  />
                </TableHead>
                <TableHead className="py-3 px-3 text-left font-semibold text-[11px] uppercase tracking-wider text-muted-foreground min-w-[170px]">
                  Product &amp; Variant
                </TableHead>
                <TableHead className="py-3 px-3 text-left font-semibold text-[11px] uppercase tracking-wider text-muted-foreground min-w-[100px]">
                  Category
                </TableHead>
                <TableHead className="py-3 px-3 text-left font-semibold text-[11px] uppercase tracking-wider text-muted-foreground min-w-[80px]">
                  Pack Size
                </TableHead>
                <TableHead className="py-3 px-3 text-left font-semibold text-[11px] uppercase tracking-wider text-muted-foreground min-w-[85px]">
                  Cost Price
                </TableHead>
                <TableHead className="py-3 px-3 text-left font-semibold text-[11px] uppercase tracking-wider text-muted-foreground min-w-[80px]">
                  Min Sell
                </TableHead>
                <TableHead className="py-3 px-3 text-left font-semibold text-[11px] uppercase tracking-wider text-muted-foreground min-w-[80px]">
                  Max Sell
                </TableHead>
                <TableHead className="py-3 px-3 text-left font-semibold text-[11px] uppercase tracking-wider text-muted-foreground min-w-[105px]">
                  Profit Range
                </TableHead>
                <TableHead className="py-3 px-3 text-left font-semibold text-[11px] uppercase tracking-wider text-muted-foreground min-w-[75px]">
                  Margin
                </TableHead>
                <TableHead className="py-3 px-3 text-left font-semibold text-[11px] uppercase tracking-wider text-muted-foreground min-w-[85px]">
                  Status
                </TableHead>
                <TableHead className="w-10 px-2 text-right" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {variants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="py-12 text-center text-muted-foreground">
                    No products or variants found matching your filters.
                  </TableCell>
                </TableRow>
              ) : (
                variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id
                  const isChecked = selectedIds.has(v.id)

                  const cost = v.pricing?.costPrice ?? 0
                  const minSell = v.pricing?.minSellingPrice ?? 0
                  const maxSell = v.pricing?.maxSellingPrice ?? 0

                  return (
                    <TableRow
                      key={v.id}
                      onClick={() => onSelectVariant(v)}
                      className={`cursor-pointer transition-colors border-b border-border/60 ${
                        isSelected
                          ? "bg-muted/70 dark:bg-zinc-800/60 hover:bg-muted dark:hover:bg-zinc-800/80"
                          : "hover:bg-muted/30 dark:hover:bg-zinc-900/40"
                      }`}
                    >
                      {/* Checkbox */}
                      <TableCell className="px-3 text-center" onClick={(e) => handleSelectRow(v.id, e)}>
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => {
                            setSelectedIds((prev) => {
                              const next = new Set(prev)
                              if (next.has(v.id)) next.delete(v.id)
                              else next.add(v.id)
                              return next
                            })
                          }}
                          aria-label={`Select ${v.product.name} ${v.name}`}
                          className="h-3.5 w-3.5"
                        />
                      </TableCell>

                      {/* Product & Variant (STRICTLY NO IMAGES) */}
                      <TableCell className="py-3 px-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground text-xs tracking-tight">
                            {v.product.name}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-normal mt-0.5">
                            {v.name}
                          </span>
                        </div>
                      </TableCell>

                      {/* Category */}
                      <TableCell className="py-3 px-3 text-xs text-muted-foreground font-normal">
                        {v.product.category.name}
                      </TableCell>

                      {/* Pack Size Pill */}
                      <TableCell className="py-3 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted/60 dark:bg-zinc-800 border border-border/80 text-foreground">
                          {v.packSize}
                        </span>
                      </TableCell>

                      {/* Cost Price */}
                      <TableCell className="py-3 px-3 font-mono text-xs text-foreground font-medium">
                        {formatCurrency(cost)}
                      </TableCell>

                      {/* Min Sell */}
                      <TableCell className="py-3 px-3 font-mono text-xs text-foreground font-medium">
                        {formatCurrency(minSell)}
                      </TableCell>

                      {/* Max Sell */}
                      <TableCell className="py-3 px-3 font-mono text-xs text-foreground font-medium">
                        {formatCurrency(maxSell)}
                      </TableCell>

                      {/* Profit Range */}
                      <TableCell className="py-3 px-3 font-mono text-xs font-semibold">
                        <span className={v.profitMin > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>
                          {formatProfitRange(v.profitMin, v.profitMax)}
                        </span>
                      </TableCell>

                      {/* Margin */}
                      <TableCell className="py-3 px-3 font-mono text-xs text-foreground font-medium">
                        {formatMargin(v.marginMin)}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-3 px-3">
                        {v.healthStatus === "Good" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-sans">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Good
                          </span>
                        )}
                        {v.healthStatus === "Low" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-sans">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            Low
                          </span>
                        )}
                        {v.healthStatus === "Issue" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 font-sans">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            Issue
                          </span>
                        )}
                      </TableCell>

                      {/* Row Actions Dropdown */}
                      <TableCell className="px-2 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                              <MoreVertical className="h-3.5 w-3.5" />
                              <span className="sr-only">Row Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 bg-popover border-border">
                            <DropdownMenuItem
                              onClick={() => onSelectVariant(v)}
                              className="text-xs cursor-pointer gap-2"
                            >
                              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>View Details</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                onSelectVariant(v)
                                onOpenPricingEdit?.(v)
                              }}
                              className="text-xs cursor-pointer gap-2"
                            >
                              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>Update Pricing</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setVariantToDelete(v)}
                              className="text-xs cursor-pointer gap-2 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Delete Variant</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination & Record Count Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1 py-1 text-xs">
        {/* Left: Showing Range */}
        <p className="text-muted-foreground font-medium">
          Showing {startIndex}–{endIndex} of {totalCount} variants
        </p>

        {/* Right: Page Buttons */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1 self-center sm:self-auto">
            {/* Previous */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="h-8 w-8 p-0 border-border bg-card hover:bg-muted text-foreground"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span className="sr-only">Previous page</span>
            </Button>

            {/* Page numbers */}
            {getPaginationItems().map((item, idx) => {
              if (item === "...") {
                return (
                  <span key={`dots-${idx}`} className="px-1.5 text-muted-foreground">
                    ...
                  </span>
                )
              }
              const pageNum = Number(item)
              const isActive = pageNum === currentPage
              return (
                <Button
                  key={`page-${pageNum}`}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  className={`h-8 w-8 p-0 font-medium text-xs ${
                    isActive
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold shadow-2xs hover:bg-zinc-800"
                      : "border-border bg-card hover:bg-muted text-foreground"
                  }`}
                >
                  {pageNum}
                </Button>
              )
            })}

            {/* Next */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              className="h-8 w-8 p-0 border-border bg-card hover:bg-muted text-foreground"
            >
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="sr-only">Next page</span>
            </Button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={Boolean(variantToDelete)} onOpenChange={(open) => !open && setVariantToDelete(null)}>
        <AlertDialogContent className="bg-popover border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Variant?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-xs">
              Are you sure you want to delete{" "}
              <strong className="text-foreground">{variantToDelete?.product.name} ({variantToDelete?.name})</strong>?
              If this variant has historical order items, it will be deactivated to protect order history integrity.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-foreground hover:bg-muted text-xs">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-rose-600 text-white hover:bg-rose-700 text-xs font-semibold"
            >
              {isDeleting ? "Deleting..." : "Delete Variant"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
