"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { updateShipmentStatus } from "@/app/actions/inventory"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

export function MarkArrivedButton({ shipmentId }: { shipmentId: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleMarkArrived = () => {
    startTransition(async () => {
      try {
        await updateShipmentStatus(shipmentId, "ARRIVED")
        router.refresh()
      } catch (error) {
        console.error("Failed to update status:", error)
      }
    })
  }

  return (
    <Button size="sm" variant="outline" onClick={handleMarkArrived} disabled={isPending}>
      <CheckCircle className="mr-2 h-4 w-4" />
      {isPending ? "Updating..." : "Mark Arrived"}
    </Button>
  )
}
