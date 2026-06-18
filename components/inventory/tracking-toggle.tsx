"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toggleInventoryTracking } from "@/app/actions/inventory"
import { Switch } from "@/components/ui/switch"

export function TrackingToggle({ variantId, isTracked }: { variantId: string, isTracked: boolean }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleToggle = (checked: boolean) => {
    startTransition(async () => {
      try {
        await toggleInventoryTracking(variantId, checked)
        router.refresh()
      } catch (error) {
        console.error("Failed to toggle tracking:", error)
      }
    })
  }

  return (
    <Switch 
      checked={isTracked} 
      onCheckedChange={handleToggle}
      disabled={isPending}
      className={isPending ? "opacity-50" : ""}
    />
  )
}
