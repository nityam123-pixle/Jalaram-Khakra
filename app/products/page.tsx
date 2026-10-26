import { getProductsWorkspaceData } from "@/app/actions/products"
import { ProductsCommandCenter } from "@/components/products/products-command-center"

export const dynamic = "force-dynamic"

export default async function ProductsPage() {
  const data = await getProductsWorkspaceData()

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
      <ProductsCommandCenter initialData={data} />
    </div>
  )
}
