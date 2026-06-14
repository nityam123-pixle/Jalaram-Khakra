import { getFullCatalog } from "@/app/actions/catalog"
import { CatalogManager } from "@/components/catalog-manager"
import { serializePrisma } from "@/lib/prisma-serializer"

export const dynamic = "force-dynamic"

export default async function CataloguePage() {
  const catalogDataRaw = await getFullCatalog()
  const catalogData = serializePrisma(catalogDataRaw)

  return (
    <div className="flex-1 w-full">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Catalogue Management</h2>
          <p className="text-muted-foreground">
            Manage products, variants, and pricing rules. All changes reflect immediately in the order wizard.
          </p>
        </div>
        <CatalogManager catalogData={catalogData} />
      </div>
    </div>
  )
}
