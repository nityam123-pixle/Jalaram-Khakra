"use client"

import { useTransition, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toggleInventoryTracking } from "@/app/actions/inventory"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

export function TrackingToggle({ variantId, isTracked }: { variantId: string, isTracked: boolean }) {
  const [isPending, startTransition] = useTransition()
  const [localTracked, setLocalTracked] = useState(isTracked)
  const router = useRouter()

  // Sync state if prop changes from server
  useEffect(() => {
    setLocalTracked(isTracked)
  }, [isTracked])

  const handleToggle = (checked: boolean) => {
    // Optimistically update the UI state instantly
    setLocalTracked(checked)
    
    startTransition(async () => {
      try {
        await toggleInventoryTracking(variantId, checked)
        router.refresh()
        toast.success(
          checked 
            ? "Inventory tracking enabled successfully" 
            : "Inventory tracking disabled successfully"
        )
      } catch (error) {
        // Revert UI state on failure
        setLocalTracked(!checked)
        console.error("Failed to toggle tracking:", error)
        toast.error("Failed to update inventory tracking")
      }
    })
  }

  return (
    <Switch 
      checked={localTracked} 
      onCheckedChange={handleToggle}
      disabled={isPending}
      className={isPending ? "opacity-50" : ""}
    />
  )
}

