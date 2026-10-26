"use client"

interface CategoryStripItem {
  id: string
  name: string
  slug: string
  productCount: number
}

interface CategoryNavigationStripProps {
  categories: CategoryStripItem[]
  selectedCategoryId: string // "all" or specific category ID
  onSelectCategory: (categoryId: string) => void
  totalProductsCount: number
}

export function CategoryNavigationStrip({
  categories,
  selectedCategoryId,
  onSelectCategory,
  totalProductsCount,
}: CategoryNavigationStripProps) {
  const isAllActive = selectedCategoryId === "all"

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-0.5">
      <div className="flex items-center gap-1.5 p-1 bg-card border border-border/80 rounded-xl min-w-max">
        {/* All Products Tab */}
        <button
          type="button"
          onClick={() => onSelectCategory("all")}
          className={`flex flex-col items-center justify-center px-4 sm:px-5 py-2 rounded-lg text-center transition-all ${
            isAllActive
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs font-semibold"
              : "text-foreground hover:bg-muted/60 dark:hover:bg-zinc-800/60"
          }`}
        >
          <span className="text-xs font-medium tracking-tight whitespace-nowrap">
            All Products
          </span>
          <span
            className={`text-[11px] whitespace-nowrap mt-0.5 ${
              isAllActive ? "text-zinc-300 dark:text-zinc-600 font-medium" : "text-muted-foreground"
            }`}
          >
            {totalProductsCount} products
          </span>
        </button>

        {/* Individual Category Tabs */}
        {categories.map((cat) => {
          const isActive = selectedCategoryId === cat.id
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`flex flex-col items-center justify-center px-4 sm:px-5 py-2 rounded-lg text-center transition-all ${
                isActive
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs font-semibold"
                  : "text-foreground hover:bg-muted/60 dark:hover:bg-zinc-800/60"
              }`}
            >
              <span className="text-xs font-medium tracking-tight whitespace-nowrap">
                {cat.name}
              </span>
              <span
                className={`text-[11px] whitespace-nowrap mt-0.5 ${
                  isActive ? "text-zinc-300 dark:text-zinc-600 font-medium" : "text-muted-foreground"
                }`}
              >
                {cat.productCount} products
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
