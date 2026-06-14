"use client"
import { Button } from "@/components/ui/button"
import { updateOrderStatus, deleteOrder } from "@/app/actions/order"
import { Check, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

export function OrderActions({ orderId, status }: { orderId: string, status: string }) {
  const router = useRouter()

  const handleComplete = async () => {
    await updateOrderStatus(orderId, "completed")
    router.refresh()
  }

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this order?")) {
      await deleteOrder(orderId)
      router.push("/orders")
    }
  }

  const normalizedStatus = status?.toLowerCase() || "pending"

  return (
    <div className="flex gap-2">
      {normalizedStatus === "pending" && (
        <Button variant="outline" className="text-emerald-600 hover:text-emerald-700" onClick={handleComplete}>
          <Check className="w-4 h-4 mr-2" /> Mark Completed
        </Button>
      )}
      <Button variant="destructive" onClick={handleDelete}>
        <Trash2 className="w-4 h-4 mr-2" /> Delete
      </Button>
    </div>
  )
}
