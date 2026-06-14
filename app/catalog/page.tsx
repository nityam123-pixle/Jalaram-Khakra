import { getCategories, getProducts } from "../actions/catalog"

export default async function CatalogPage() {
  const categories = await getCategories()
  const products = await getProducts()

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Catalog Management</h1>
        <p className="text-muted-foreground">Manage categories, products, and variants</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Categories</h2>
          <div className="border rounded-md p-4 space-y-4">
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">No categories found.</p>
            ) : (
              categories.map(cat => (
                <div key={cat.id} className="flex justify-between items-center p-2 border-b last:border-0">
                  <span>{cat.name}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${cat.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {cat.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Products</h2>
          <div className="border rounded-md p-4 space-y-4">
            {products.length === 0 ? (
              <p className="text-sm text-muted-foreground">No products found.</p>
            ) : (
              products.map(prod => (
                <div key={prod.id} className="flex flex-col p-2 border-b last:border-0 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{prod.name}</span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {prod.category.name}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground pl-4 border-l-2 border-gray-200 space-y-1">
                    {prod.variants.map(v => (
                      <div key={v.id} className="flex justify-between">
                        <span>{v.name} ({v.unitType})</span>
                        <span>
                          {v.pricingRules[0]?.pricingType === 'FIXED' 
                            ? `₹${v.pricingRules[0]?.minSellingPrice}`
                            : `₹${v.pricingRules[0]?.minSellingPrice} - ₹${v.pricingRules[0]?.maxSellingPrice}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
