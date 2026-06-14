import { getOrderById } from "@/app/actions/order"
import { notFound } from "next/navigation"
import { serializePrisma } from "@/lib/prisma-serializer"
import { EditOrderClient } from "./edit-client"
import { getFullCatalog } from "@/app/actions/catalog"

export const dynamic = "force-dynamic"

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [order, catalogRaw] = await Promise.all([
    getOrderById(id),
    getFullCatalog()
  ])
  
  if (!order) {
    notFound()
  }

  const serializedOrder = serializePrisma(order)
  const serializedCatalog = serializePrisma(catalogRaw)

  return (
    <div className="flex-1 w-full">
      <EditOrderClient order={serializedOrder} catalog={serializedCatalog} />
    </div>
  )
}
