"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Eye, Plus, Edit2, Trash2 } from "lucide-react"

interface CustomerActionsMenuProps {
  customer: any
  onViewProfile: (customer: any) => void
  onEdit: (customer: any) => void
  onDelete: (customer: any) => void
}

export function CustomerActionsMenu({
  customer,
  onViewProfile,
  onEdit,
  onDelete,
}: CustomerActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted text-muted-foreground hover:text-foreground">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px] bg-card border border-border/80">
        <DropdownMenuItem onClick={() => onViewProfile(customer)} className="gap-2 text-xs cursor-pointer">
          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
          <span>View Profile & History</span>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="gap-2 text-xs cursor-pointer">
          <a href={`/orders/new?customerId=${customer.id}`}>
            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Create Order</span>
          </a>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => onEdit(customer)} className="gap-2 text-xs cursor-pointer">
          <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Edit Customer</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="border-border" />
        <DropdownMenuItem
          onClick={() => onDelete(customer)}
          className="gap-2 text-xs text-rose-600 dark:text-rose-400 font-medium cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
          <span>Delete Customer</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
