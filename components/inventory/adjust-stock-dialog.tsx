"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { adjustStock } from "@/app/actions/inventory"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Edit } from "lucide-react"

export function AdjustStockDialog({ variantId, currentStock, variantName, productName }: { 
  variantId: string
  currentStock: number
  variantName: string
  productName: string 
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const [adjustment, setAdjustment] = useState("")

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const amount = Number(formData.get("amount"))
    
    if (amount === 0) {
      setOpen(false)
      return
    }

    startTransition(async () => {
      try {
        await adjustStock(
          variantId,
          amount,
          formData.get("notes") as string || undefined
        )
        setOpen(false)
        setAdjustment("")
        router.refresh()
      } catch (error) {
        console.error("Failed to adjust stock:", error)
      }
    })
  }

  const newStock = currentStock + (Number(adjustment) || 0)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 text-xs">
          <Edit className="mr-1.5 h-3.5 w-3.5" />
          Adjust
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
            <DialogDescription>
              Manual adjustment for <span className="font-semibold text-foreground">{productName} — {variantName}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4 bg-muted/50 p-3 rounded-lg border border-border/50">
              <div>
                <Label className="text-xs text-muted-foreground">Current Stock</Label>
                <div className="text-xl font-bold">{currentStock}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">New Stock</Label>
                <div className={`text-xl font-bold ${newStock < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                  {newStock}
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="amount">Adjustment Amount (±)</Label>
              <div className="flex gap-2 items-center">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  onClick={() => setAdjustment(String((Number(adjustment) || 0) - 1))}
                >-</Button>
                <Input 
                  id="amount" 
                  name="amount" 
                  type="number" 
                  required
                  className="text-center text-lg font-mono"
                  value={adjustment}
                  onChange={(e) => setAdjustment(e.target.value)}
                  placeholder="+/- 0"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  onClick={() => setAdjustment(String((Number(adjustment) || 0) + 1))}
                >+</Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Use negative numbers for stock removals (loss/damage). Use positive for manual additions.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Reason / Notes</Label>
              <Input id="notes" name="notes" placeholder="e.g. Found in backroom, Damaged box" required />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !adjustment || Number(adjustment) === 0}>
              {isPending ? "Adjusting..." : "Confirm Adjustment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
