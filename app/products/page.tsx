import { getFullCatalog } from "@/app/actions/catalog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, ShoppingBag, TrendingUp, IndianRupee } from "lucide-react"
import { serializePrisma } from "@/lib/prisma-serializer"

export const dynamic = "force-dynamic"

export default async function ProductsPage() {
  const rawCatalog = await getFullCatalog()
  const catalog = serializePrisma(rawCatalog)

  // Flatten all variants with their product & pricing — variants now include `product`
  type VariantRow = {
    productName: string
    variantName: string
    unitType: string
    costPrice: number
    minSell: number
    maxSell: number
    categoryName: string
  }

  const allVariants: VariantRow[] = []
  for (const cat of catalog) {
    for (const prod of cat.products) {
      for (const v of prod.variants) {
        const rule = v.pricingRules?.[0]
        allVariants.push({
          productName:  prod.name,
          variantName:  v.name,
          unitType:     v.unitType,
          costPrice:    rule?.costPrice ?? 0,
          minSell:      rule?.minSellingPrice ?? 0,
          maxSell:      rule?.maxSellingPrice ?? 0,
          categoryName: cat.name,
        })
      }
    }
  }

  const byCategory = (name: string) =>
    allVariants.filter(v => v.categoryName.toLowerCase().includes(name.toLowerCase()))

  const khakhraItems  = byCategory("khakhra")
  const bhaktriItems  = byCategory("bhakri").concat(byCategory("farali"))
  const snackItems    = byCategory("mathiya").concat(byCategory("chorafali")).concat(byCategory("puri"))
  const specialItems  = byCategory("patra").concat(byCategory("chikki"))
                         .concat(byCategory("bhakarwadi")).concat(byCategory("fulvadi"))

  const PriceTag = ({ min, max, unit, cost }: { min: number; max: number; unit: string; cost: number }) => {
    const unitLabel = unit === "KG" ? "kg" : "pkt"
    const profitMin = min - cost
    const profitMax = max - cost
    return (
      <div className="flex flex-col gap-1 text-xs mt-1">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Sell:</span>
          <Badge variant="outline" className="text-xs">
            ₹{min}–₹{max}/{unitLabel}
          </Badge>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Profit:</span>
          <span className="text-emerald-600 font-semibold text-xs">
            ₹{profitMin.toFixed(0)}–₹{profitMax.toFixed(0)}/{unitLabel}
          </span>
        </div>
      </div>
    )
  }

  const ItemList = ({ items }: { items: VariantRow[] }) => (
    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
      {items.length === 0 && (
        <p className="text-muted-foreground text-sm italic">No items in category</p>
      )}
      {items.map((item, i) => (
        <div key={i} className="p-2.5 border border-border rounded-lg bg-muted/20">
          <div className="font-medium text-sm text-foreground">{item.productName}</div>
          <PriceTag min={item.minSell} max={item.maxSell} unit={item.unitType} cost={item.costPrice} />
        </div>
      ))}
    </div>
  )

  return (
    <div className="flex-1 w-full">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Products &amp; Pricing</h2>
          <p className="text-muted-foreground">
            Live from database — all prices, profits and categories are dynamically loaded
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Khakhra */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground text-base">
                <Package className="h-4 w-4" />
                Khakhra
              </CardTitle>
              <p className="text-xs text-muted-foreground">Cost ₹195/kg · Profit ₹25–₹25/kg</p>
            </CardHeader>
            <CardContent>
              <ItemList items={khakhraItems} />
            </CardContent>
          </Card>

          {/* Bhakri / Farali */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground text-base">
                <ShoppingBag className="h-4 w-4" />
                Bhakri / Farali
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ItemList items={bhaktriItems} />
            </CardContent>
          </Card>

          {/* Mathiya / Snacks */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground text-base">
                <TrendingUp className="h-4 w-4" />
                Mathiya / Snacks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ItemList items={snackItems} />
            </CardContent>
          </Card>

          {/* Patra / Chikki / Specials */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground text-base">
                <IndianRupee className="h-4 w-4" />
                Patra / Chikki / Specials
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ItemList items={specialItems} />
            </CardContent>
          </Card>
        </div>

        {/* Full Catalogue Reference Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Full Catalogue — Live DB Reference</CardTitle>
            <p className="text-sm text-muted-foreground">
              All {allVariants.length} product variants. Go to{" "}
              <a href="/catalogue" className="underline text-primary">Catalogue Management</a>{" "}
              to edit prices, add new variants, or create products.
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Category</th>
                    <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Product</th>
                    <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Variant</th>
                    <th className="text-right py-2 pr-4 text-muted-foreground font-medium">Cost</th>
                    <th className="text-right py-2 pr-4 text-muted-foreground font-medium">Min Sell</th>
                    <th className="text-right py-2 text-muted-foreground font-medium">Max Sell</th>
                    <th className="text-right py-2 text-emerald-600 font-medium">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {allVariants.map((v, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="py-2 pr-4 text-muted-foreground text-xs">{v.categoryName}</td>
                      <td className="py-2 pr-4 font-medium text-foreground">{v.productName}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{v.variantName}</td>
                      <td className="py-2 pr-4 text-right text-muted-foreground">₹{v.costPrice}</td>
                      <td className="py-2 pr-4 text-right text-foreground">₹{v.minSell}</td>
                      <td className="py-2 pr-4 text-right text-foreground">₹{v.maxSell}</td>
                      <td className="py-2 text-right text-emerald-600 font-medium profit-value">
                        ₹{(v.minSell - v.costPrice).toFixed(0)}–₹{(v.maxSell - v.costPrice).toFixed(0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
