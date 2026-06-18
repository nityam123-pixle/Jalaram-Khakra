"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { updateOrderStatus, deleteOrder } from "@/app/actions/order"
import { Check, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function OrderActions({ orderId, status }: { orderId: string, status: string }) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [open, setOpen] = useState(false)

  const handleComplete = async () => {
    try {
      await updateOrderStatus(orderId, "completed")
      toast.success("Order marked completed successfully!")
      router.refresh()
    } catch (e) {
      toast.error("Failed to complete order")
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteOrder(orderId)
      toast.success("Order deleted successfully")
      setOpen(false)
      // Clean up body pointer-events to prevent page unresponsiveness on navigation
      document.body.style.pointerEvents = ""
      router.push("/orders")
      router.refresh()
    } catch (e) {
      toast.error("Failed to delete order")
    } finally {
      setIsDeleting(false)
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

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive">
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the order and restore any reserved inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground animate-in fade-in"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
