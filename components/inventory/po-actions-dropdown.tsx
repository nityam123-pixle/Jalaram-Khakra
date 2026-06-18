"use client";

import { useTransition } from "react";
import { updatePurchaseOrderStatus } from "@/app/actions/inventory";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Eye, CheckCircle, Truck, XCircle } from "lucide-react";

interface POActionsDropdownProps {
  poId: string;
  status: string;
}

export function POActionsDropdown({ poId, status }: POActionsDropdownProps) {
  const [isPending, startTransition] = useTransition();

  function changeStatus(newStatus: "ORDERED" | "IN_TRANSIT" | "CANCELLED") {
    startTransition(async () => {
      await updatePurchaseOrderStatus(poId, newStatus);
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={isPending}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2 text-sm cursor-pointer">
          <Eye className="h-3.5 w-3.5" />
          View Details
        </DropdownMenuItem>
        {status === "DRAFT" && (
          <DropdownMenuItem
            className="gap-2 text-sm cursor-pointer"
            onClick={() => changeStatus("ORDERED")}
          >
            <CheckCircle className="h-3.5 w-3.5 text-blue-500" />
            Mark as Ordered
          </DropdownMenuItem>
        )}
        {(status === "ORDERED" || status === "DRAFT") && (
          <DropdownMenuItem
            className="gap-2 text-sm cursor-pointer"
            onClick={() => changeStatus("IN_TRANSIT")}
          >
            <Truck className="h-3.5 w-3.5 text-amber-500" />
            Mark In Transit
          </DropdownMenuItem>
        )}
        {!["RECEIVED", "CANCELLED"].includes(status) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 text-sm cursor-pointer text-destructive focus:text-destructive"
              onClick={() => changeStatus("CANCELLED")}
            >
              <XCircle className="h-3.5 w-3.5" />
              Cancel
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
