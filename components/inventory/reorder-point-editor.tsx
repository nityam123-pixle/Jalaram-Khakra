"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { updateReorderPoint } from "@/app/actions/inventory"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Check, X, Edit2 } from "lucide-react"

export function ReorderPointEditor({ variantId, currentReorderPoint }: { variantId: string, currentReorderPoint: number }) {
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(currentReorderPoint.toString())
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSave = () => {
    const num = Number(value)
    if (isNaN(num) || num < 0) return

    startTransition(async () => {
      try {
        await updateReorderPoint(variantId, num)
        setIsEditing(false)
        router.refresh()
      } catch (error) {
        console.error("Failed to update reorder point:", error)
      }
    })
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 max-w-[120px]">
        <Input 
          type="number" 
          value={value} 
          onChange={(e) => setValue(e.target.value)}
          className="h-7 px-2 text-sm"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave()
            if (e.key === "Escape") {
              setIsEditing(false)
              setValue(currentReorderPoint.toString())
            }
          }}
        />
        <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-500" onClick={handleSave} disabled={isPending}>
          <Check className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={() => { setIsEditing(false); setValue(currentReorderPoint.toString()) }} disabled={isPending}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditing(true)}>
      <span className="font-mono text-sm">{currentReorderPoint}</span>
      <Edit2 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  )
}
