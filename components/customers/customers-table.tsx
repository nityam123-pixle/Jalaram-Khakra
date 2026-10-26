"use client"

import { format } from "date-fns"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { MapPin, ArrowUpDown, Trash2, Download, X } from "lucide-react"
import { CustomerStatusBadge } from "./customer-status-badge"
import { CustomerActionsMenu } from "./customer-actions-menu"

interface CustomersTableProps {
  customers: any[]
  selectedCustomerIds: string[]
  onSelectCustomer: (id: string, selected: boolean) => void
  onSelectAllCustomers: (selected: boolean) => void
  onViewProfile: (customer: any) => void
  onEdit: (customer: any) => void
  onDelete: (customer: any) => void
  onBulkDelete: () => void
  onBulkExport: () => void
  sortColumn?: string
  sortDirection: "asc" | "desc"
  onSort: (column: string) => void
}

export function CustomersTable({
  customers,
  selectedCustomerIds,
  onSelectCustomer,
  onSelectAllCustomers,
  onViewProfile,
  onEdit,
  onDelete,
  onBulkDelete,
  onBulkExport,
  sortColumn,
  sortDirection,
  onSort,
}: CustomersTableProps) {
  const allSelected =
    customers.length > 0 && selectedCustomerIds.length === customers.length

  const handleSelectAllChange = (checked: boolean) => {
    onSelectAllCustomers(checked)
  }

  return (
    <div className="relative">
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40 border-b border-border">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[45px] py-3.5 pl-4">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAllChange}
                  aria-label="Select all customers"
                />
              </TableHead>
              <TableHead className="py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                CUSTOMER & CITY
              </TableHead>
              <TableHead className="py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                CONTACT
              </TableHead>
              <TableHead className="py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                TOTAL ORDERS
              </TableHead>
              <TableHead className="py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSort("lifetimeRevenue")}
                  className="-ml-3 gap-1 text-xs hover:bg-transparent font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  <span>LIFETIME REVENUE</span>
                  <ArrowUpDown className="h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                LAST ORDER
              </TableHead>
              <TableHead className="py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                STATUS
              </TableHead>
              <TableHead className="w-[50px] py-3.5 pr-4 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/60">
            {customers.map((c) => {
              const isSelected = selectedCustomerIds.includes(c.id)
              let formattedDate = "Never"
              if (c.lastOrderDate) {
                try {
                  formattedDate = format(new Date(c.lastOrderDate), "d MMM yyyy")
                } catch {
                  formattedDate = "—"
                }
              }

              return (
                <TableRow
                  key={c.id}
                  className={`hover:bg-muted/30 transition-colors duration-150 ${
                    isSelected ? "bg-muted/40" : ""
                  }`}
                >
                  <TableCell className="py-3.5 pl-4">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) =>
                        onSelectCustomer(c.id, Boolean(checked))
                      }
                      aria-label={`Select customer ${c.shop_name}`}
                    />
                  </TableCell>

                  <TableCell className="py-3.5">
                    <div className="flex flex-col max-w-[240px]">
                      <button
                        onClick={() => onViewProfile(c)}
                        className="text-sm font-semibold text-foreground hover:text-emerald-600 dark:hover:text-emerald-400 text-left transition-colors duration-150 truncate"
                      >
                        {c.shop_name}
                      </button>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="text-[11px] text-muted-foreground truncate capitalize">
                          {c.city}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="py-3.5 text-xs font-mono text-muted-foreground">
                    {c.phone || "—"}
                  </TableCell>

                  <TableCell className="py-3.5 text-xs font-bold font-mono text-foreground">
                    {c.totalOrders}
                  </TableCell>

                  <TableCell className="py-3.5 text-xs font-bold font-mono text-foreground">
                    ₹{c.lifetimeRevenue.toLocaleString("en-IN")}
                  </TableCell>

                  <TableCell className="py-3.5 text-xs text-muted-foreground">
                    {formattedDate}
                  </TableCell>

                  <TableCell className="py-3.5">
                    <CustomerStatusBadge status={c.status} />
                  </TableCell>

                  <TableCell className="py-3.5 pr-4 text-right">
                    <CustomerActionsMenu
                      customer={c}
                      onViewProfile={onViewProfile}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedCustomerIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-background/95 dark:bg-card/95 border border-border/80 px-4 py-3 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-300 max-w-[95vw]">
          <div className="text-xs font-bold text-foreground px-2 border-r border-border shrink-0">
            {selectedCustomerIds.length} selected
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBulkExport}
              className="text-xs gap-1.5 h-8 hover:bg-muted"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onBulkDelete}
              className="text-xs text-rose-600 dark:text-rose-400 gap-1.5 h-8 hover:bg-rose-50 dark:hover:bg-rose-950/20"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Delete Selected</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelectAllCustomers(false)}
              className="text-xs text-muted-foreground gap-1 h-8 shrink-0 hover:bg-muted"
            >
              <X className="h-3.5 w-3.5" />
              <span>Clear</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
