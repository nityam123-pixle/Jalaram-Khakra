import { getSuppliers } from "@/app/actions/inventory"
import { SuppliersClient } from "./client"

export default async function SuppliersPage() {
  const suppliers = await getSuppliers()
  return <SuppliersClient initialData={suppliers} />
}
