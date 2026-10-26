"use client"

import { useState, useMemo, useEffect, useRef, useTransition } from "react"
import { ProductsHeader } from "./products-header"
import { ProductsMetrics } from "./products-metrics"
import { CategoryNavigationStrip } from "./category-navigation-strip"
import { ProductsToolbar } from "./products-toolbar"
import { ProductsTable } from "./products-table"
import { ProductsGrid } from "./products-grid"
import { ProductDetailsInspector } from "./product-details-inspector"
import { AddProductDialog } from "./add-product-dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { getProductsWorkspaceData, deleteProductVariant } from "@/app/actions/products"
import type { ProductsWorkspaceData, VariantWorkspaceItem } from "@/app/actions/products"
import { toast } from "sonner"

interface ProductsCommandCenterProps {
  initialData: ProductsWorkspaceData
}

export function ProductsCommandCenter({ initialData }: ProductsCommandCenterProps) {
  const [data, setData] = useState<ProductsWorkspaceData>(initialData)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Filters State
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedProduct, setSelectedProduct] = useState<string>("all")
  const [selectedVariantPack, setSelectedVariantPack] = useState<string>("all")
  const [selectedHealth, setSelectedHealth] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("name_asc")
  const [viewMode, setViewMode] = useState<"table" | "grid">("table")
  const [currentPage, setCurrentPage] = useState<number>(1)
  const pageSize = 10

  // UI States
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isAddProductOpen, setIsAddProductOpen] = useState(false)
  const [inspectorOpen, setInspectorOpen] = useState(true)
  const [inspectorTab, setInspectorTab] = useState<"details" | "pricing" | "inventory" | "history">("details")
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false)
  const [, startTransition] = useTransition()

  // Find initial selected variant (try to find Bajri Lasan or first available)
  const [selectedVariant, setSelectedVariant] = useState<VariantWorkspaceItem | null>(() => {
    const defaultBajri = initialData.variants.find(
      (v) => v.product.name.toLowerCase().includes("bajri lasan") && v.packSize === "200g"
    )
    return defaultBajri || initialData.variants[0] || null
  })

  // Keyboard shortcut ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Debounce search input (200ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setCurrentPage(1)
    }, 200)
    return () => clearTimeout(timer)
  }, [search])

  // Refresh data from server
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const freshData = await getProductsWorkspaceData()
      setData(freshData)
      toast.success("Products & Pricing refreshed")
    } catch {
      toast.error("Failed to refresh products")
    } finally {
      setTimeout(() => setIsRefreshing(false), 300)
    }
  }

  // Filtered products list for Product dropdown
  const productOptions = useMemo(() => {
    const prodsMap = new Map<string, { id: string; name: string }>()
    data.variants.forEach((v) => {
      if (selectedCategory === "all" || v.product.categoryId === selectedCategory) {
        prodsMap.set(v.product.id, { id: v.product.id, name: v.product.name })
      }
    })
    return Array.from(prodsMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [data.variants, selectedCategory])

  // Unique pack sizes for Variant filter dropdown
  const variantPackOptions = useMemo(() => {
    const set = new Set<string>()
    data.variants.forEach((v) => {
      if (v.packSize) set.add(v.packSize)
    })
    return Array.from(set).sort()
  }, [data.variants])

  // Filter and sort variants
  const filteredVariants = useMemo(() => {
    let result = [...data.variants]

    // 1. Search filter
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim()
      result = result.filter(
        (v) =>
          v.product.name.toLowerCase().includes(q) ||
          v.name.toLowerCase().includes(q) ||
          v.product.category.name.toLowerCase().includes(q) ||
          (v.sku && v.sku.toLowerCase().includes(q))
      )
    }

    // 2. Category filter
    if (selectedCategory !== "all") {
      result = result.filter((v) => v.product.categoryId === selectedCategory)
    }

    // 3. Product filter
    if (selectedProduct !== "all") {
      result = result.filter((v) => v.product.id === selectedProduct)
    }

    // 4. Variant pack size filter
    if (selectedVariantPack !== "all") {
      result = result.filter((v) => v.packSize === selectedVariantPack)
    }

    // 5. Health status filter
    if (selectedHealth !== "all") {
      result = result.filter((v) => v.healthStatus === selectedHealth)
    }

    // 6. Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "name_asc":
          return (
            ((a.product.category as any).displayOrder ?? 0) - ((b.product.category as any).displayOrder ?? 0) ||
            a.product.name.localeCompare(b.product.name) ||
            b.name.localeCompare(a.name)
          )
        case "name_desc":
          return b.product.name.localeCompare(a.product.name) || b.name.localeCompare(a.name)
        case "cost_asc":
          return (a.pricing?.costPrice ?? 0) - (b.pricing?.costPrice ?? 0)
        case "cost_desc":
          return (b.pricing?.costPrice ?? 0) - (a.pricing?.costPrice ?? 0)
        case "minSell_asc":
          return (a.pricing?.minSellingPrice ?? 0) - (b.pricing?.minSellingPrice ?? 0)
        case "minSell_desc":
          return (b.pricing?.minSellingPrice ?? 0) - (a.pricing?.minSellingPrice ?? 0)
        case "maxSell_asc":
          return (a.pricing?.maxSellingPrice ?? 0) - (b.pricing?.maxSellingPrice ?? 0)
        case "maxSell_desc":
          return (b.pricing?.maxSellingPrice ?? 0) - (a.pricing?.maxSellingPrice ?? 0)
        case "profit_desc":
          return b.profitMax - a.profitMax
        case "margin_desc":
          return b.marginMax - a.marginMax
        case "margin_asc":
          return a.marginMin - b.marginMin
        default:
          return 0
      }
    })

    return result
  }, [
    data.variants,
    debouncedSearch,
    selectedCategory,
    selectedProduct,
    selectedVariantPack,
    selectedHealth,
    sortBy,
  ])

  // Paginated slice
  const paginatedVariants = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredVariants.slice(startIndex, startIndex + pageSize)
  }, [filteredVariants, currentPage, pageSize])

  // Ensure a selected variant exists if list is not empty
  useEffect(() => {
    if (filteredVariants.length > 0) {
      if (!selectedVariant || !filteredVariants.some((v) => v.id === selectedVariant.id)) {
        setSelectedVariant(filteredVariants[0])
      }
    } else {
      setSelectedVariant(null)
    }
  }, [filteredVariants, selectedVariant])

  // Handlers
  const handleSelectCategory = (catId: string) => {
    setSelectedCategory(catId)
    setSelectedProduct("all")
    setCurrentPage(1)
  }

  const handleSelectProduct = (prodId: string) => {
    setSelectedProduct(prodId)
    setCurrentPage(1)
  }

  const handleSelectVariantPack = (pack: string) => {
    setSelectedVariantPack(pack)
    setCurrentPage(1)
  }

  const handleSelectHealth = (health: string) => {
    setSelectedHealth(health)
    setCurrentPage(1)
  }

  const handleClearFilters = () => {
    setSearch("")
    setDebouncedSearch("")
    setSelectedCategory("all")
    setSelectedProduct("all")
    setSelectedVariantPack("all")
    setSelectedHealth("all")
    setSortBy("name_asc")
    setCurrentPage(1)
  }

  const handleSelectRow = (variant: VariantWorkspaceItem) => {
    setSelectedVariant(variant)
    setInspectorOpen(true)
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setMobileInspectorOpen(true)
    }
  }

  const handleOpenPricingEdit = (variant: VariantWorkspaceItem) => {
    setSelectedVariant(variant)
    setInspectorOpen(true)
    setInspectorTab("pricing")
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setMobileInspectorOpen(true)
    }
  }

  const handleDeleteVariant = async (variantId: string) => {
    await deleteProductVariant(variantId)
    toast.success("Variant deleted successfully")
    await handleRefresh()
  }

  const handleCreateSuccess = async (newVariantId?: string) => {
    const freshData = await getProductsWorkspaceData()
    setData(freshData)
    if (newVariantId) {
      const found = freshData.variants.find((v) => v.id === newVariantId)
      if (found) {
        setSelectedVariant(found)
        setInspectorOpen(true)
      }
    }
  }

  // Export CSV
  const handleExportCSV = () => {
    setIsExporting(true)
    try {
      const headers = [
        "Product Name",
        "Variant Name",
        "Category",
        "Pack Size",
        "SKU",
        "Cost Price (₹)",
        "Min Selling Price (₹)",
        "Max Selling Price (₹)",
        "Min Profit (₹)",
        "Max Profit (₹)",
        "Min Margin (%)",
        "Max Margin (%)",
        "Price Health Status"
      ]

      const rows = filteredVariants.map((v) => [
        `"${v.product.name.replace(/"/g, '""')}"`,
        `"${v.name.replace(/"/g, '""')}"`,
        `"${v.product.category.name.replace(/"/g, '""')}"`,
        `"${v.packSize}"`,
        `"${v.sku || ""}"`,
        Number(v.pricing?.costPrice ?? 0),
        Number(v.pricing?.minSellingPrice ?? 0),
        Number(v.pricing?.maxSellingPrice ?? 0),
        v.profitMin,
        v.profitMax,
        v.marginMin,
        v.marginMax,
        `"${v.healthStatus}"`
      ])

      const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `products-pricing-export-${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success("Exported catalogue CSV successfully")
    } catch {
      toast.error("Failed to export CSV")
    } finally {
      setIsExporting(false)
    }
  }

  const hasActiveFilters =
    Boolean(search) ||
    selectedCategory !== "all" ||
    selectedProduct !== "all" ||
    selectedVariantPack !== "all" ||
    selectedHealth !== "all" ||
    sortBy !== "name_asc"

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* 1. Page Header */}
      <ProductsHeader
        search={search}
        onSearchChange={setSearch}
        onExport={handleExportCSV}
        onRefresh={handleRefresh}
        onAddProduct={() => setIsAddProductOpen(true)}
        isRefreshing={isRefreshing}
        isExporting={isExporting}
        searchInputRef={searchInputRef}
      />

      {/* 2. 4 Summary Metric Panels */}
      <ProductsMetrics
        stats={data.stats}
        onSelectHealthFilter={handleSelectHealth}
      />

      {/* 3. Horizontal Category Navigation Strip */}
      <CategoryNavigationStrip
        categories={data.categories}
        selectedCategoryId={selectedCategory}
        onSelectCategory={handleSelectCategory}
        totalProductsCount={data.stats.totalProducts}
      />

      {/* 4. Search and Filter Toolbar */}
      <ProductsToolbar
        categories={data.categories}
        selectedCategory={selectedCategory}
        onCategoryChange={handleSelectCategory}
        products={productOptions}
        selectedProduct={selectedProduct}
        onProductChange={handleSelectProduct}
        variantOptions={variantPackOptions}
        selectedVariant={selectedVariantPack}
        onVariantChange={handleSelectVariantPack}
        selectedHealth={selectedHealth}
        onHealthChange={handleSelectHealth}
        sortBy={sortBy}
        onSortChange={setSortBy}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
      />

      {/* 5. Main Workspace: Table/Grid on Left + Persistent Inspector on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Main Products Listing (reclaims full width if inspector is closed) */}
        <div
          className={`${
            inspectorOpen
              ? "lg:col-span-8 xl:col-span-8"
              : "lg:col-span-12 xl:col-span-12"
          } w-full transition-all duration-300`}
        >
          {viewMode === "table" ? (
            <ProductsTable
              variants={paginatedVariants}
              totalCount={filteredVariants.length}
              currentPage={currentPage}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              selectedVariant={selectedVariant}
              onSelectVariant={handleSelectRow}
              onOpenPricingEdit={handleOpenPricingEdit}
              onDeleteVariant={handleDeleteVariant}
            />
          ) : (
            <ProductsGrid
              variants={paginatedVariants}
              selectedVariant={selectedVariant}
              onSelectVariant={handleSelectRow}
            />
          )}
        </div>

        {/* Right-Side Persistent Product Details Inspector (Desktop) */}
        {inspectorOpen && (
          <div className="hidden lg:block lg:col-span-4 xl:col-span-4 sticky top-20">
            <ProductDetailsInspector
              variant={selectedVariant}
              categories={data.categories}
              onClose={() => setInspectorOpen(false)}
              onRefreshData={handleRefresh}
              activeTab={inspectorTab}
              onTabChange={setInspectorTab}
            />
          </div>
        )}
      </div>

      {/* Mobile / Tablet Inspector Sheet */}
      <Sheet open={mobileInspectorOpen} onOpenChange={setMobileInspectorOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-y-auto bg-card border-border">
          <SheetHeader className="sr-only">
            <SheetTitle>Product Details</SheetTitle>
          </SheetHeader>
          <div className="p-4 h-full">
            <ProductDetailsInspector
              variant={selectedVariant}
              categories={data.categories}
              onClose={() => setMobileInspectorOpen(false)}
              onRefreshData={handleRefresh}
              activeTab={inspectorTab}
              onTabChange={setInspectorTab}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Add Product Modal Dialog */}
      <AddProductDialog
        open={isAddProductOpen}
        onOpenChange={setIsAddProductOpen}
        categories={data.categories}
        onSuccess={handleCreateSuccess}
      />
    </div>
  )
}
