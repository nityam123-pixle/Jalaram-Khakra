"use client"

import { format, parseISO } from "date-fns"
import { MapPin, Phone, Plus, Search } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { addCustomer, fetchAllCustomers, fetchOrdersForShop, type Customer } from "@/lib/customers"
import { CITIES } from "@/lib/supabase"
import { cn } from "@/lib/utils"

type OrderRow = {
  id: string
  shop_name: string
  city: string
  total_amount: number
  created_at: string
  khakhra_items?: { khakhra_type: string; quantity_kg: number }[] | null
}

function initials(name: string) {
  const t = name.trim()
  if (t.length < 2) return t.toUpperCase() || "?"
  return t.slice(0, 2).toUpperCase()
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const [addOpen, setAddOpen] = useState(false)
  const [newShop, setNewShop] = useState("")
  const [newCity, setNewCity] = useState(CITIES[0] ?? "")
  const [newAddress, setNewAddress] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [addSaving, setAddSaving] = useState(false)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetCustomer, setSheetCustomer] = useState<Customer | null>(null)
  const [sheetOrders, setSheetOrders] = useState<OrderRow[]>([])
  const [sheetLoading, setSheetLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const rows = await fetchAllCustomers()
    setCustomers(rows)
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return customers
    return customers.filter(
      (c) =>
        c.shop_name.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q),
    )
  }, [customers, searchQuery])

  const openOrdersSheet = async (c: Customer) => {
    setSheetCustomer(c)
    setSheetOpen(true)
    setSheetLoading(true)
    setSheetOrders([])
    const rows = (await fetchOrdersForShop(c.shop_name)) as OrderRow[]
    setSheetOrders(rows)
    setSheetLoading(false)
  }

  const handleAddCustomer = async () => {
    if (!newShop.trim()) {
      toast.error("Shop name is required")
      return
    }
    if (!newCity) {
      toast.error("City is required")
      return
    }
    setAddSaving(true)
    const created = await addCustomer({
      shop_name: newShop.trim(),
      city: newCity,
      address: newAddress.trim() || null,
      phone: newPhone.trim() || null,
    })
    setAddSaving(false)
    if (!created) {
      toast.error("Could not add customer")
      return
    }
    toast.success("Customer added")
    setAddOpen(false)
    setNewShop("")
    setNewCity(CITIES[0] ?? "")
    setNewAddress("")
    setNewPhone("")
    void load()
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Customers</h1>
          <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {customers.length} total
          </span>
        </div>
        <Button
          type="button"
          size="sm"
          className="w-full sm:w-auto"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="mr-2 size-4" />
          Add Customer
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by shop name or city…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl border border-border" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Card
              key={c.id}
              className={cn(
                "kk-card flex flex-col border-border bg-card transition-colors hover:border-muted-foreground/30",
              )}
            >
              <CardContent className="flex flex-1 flex-col gap-3 pt-6">
                <div className="flex gap-3">
                  <div
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground"
                    aria-hidden
                  >
                    {initials(c.shop_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold leading-tight">{c.shop_name}</p>
                    <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="size-3 shrink-0" />
                      {c.city}
                    </p>
                  </div>
                </div>
                {c.phone ? (
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Phone className="size-3 shrink-0" />
                    {c.phone}
                  </p>
                ) : null}
              </CardContent>
              <CardFooter className="mt-auto border-t border-border pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => void openOrdersSheet(c)}
                >
                  View Orders
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>{searchQuery.trim() ? "No customers match your search." : "No customers loaded."}</p>
          {!searchQuery.trim() && customers.length === 0 && (
            <p className="max-w-xl text-xs leading-relaxed">
              If your Supabase table has rows but this shows none: Row Level Security may be blocking the browser.
              Run <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">scripts/fix-customers-rls.sql</code>{" "}
              in the SQL Editor, or set{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">SUPABASE_SERVICE_ROLE_KEY</code> in
              server env. Also confirm{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">NEXT_PUBLIC_SUPABASE_URL</code> matches
              the project where you see the data.
            </p>
          )}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="border-border bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-shop">Shop Name</Label>
              <Input
                id="new-shop"
                value={newShop}
                onChange={(e) => setNewShop(e.target.value)}
                placeholder="Shop name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Select value={newCity} onValueChange={setNewCity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-address">Address</Label>
              <Textarea
                id="new-address"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="Address (optional)"
                className="min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-phone">Phone</Label>
              <Input
                id="new-phone"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="Phone (optional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleAddCustomer()} disabled={addSaving}>
              {addSaving ? "Saving…" : "Add Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet
        open={sheetOpen}
        onOpenChange={(o) => {
          setSheetOpen(o)
          if (!o) {
            setSheetCustomer(null)
            setSheetOrders([])
          }
        }}
      >
        <SheetContent className="flex w-full flex-col border-border bg-card sm:max-w-lg">
          <SheetHeader className="text-left">
            <SheetTitle>{sheetCustomer?.shop_name ?? "Orders"}</SheetTitle>
            <SheetDescription>{sheetCustomer?.city}</SheetDescription>
          </SheetHeader>
          <div className="mt-4 flex min-h-0 flex-1 flex-col gap-0 overflow-y-auto pr-1">
            {sheetLoading && (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg border border-border" />
                ))}
              </div>
            )}
            {!sheetLoading && sheetOrders.length === 0 && (
              <p className="text-sm text-muted-foreground">No orders found for this customer.</p>
            )}
            {!sheetLoading &&
              sheetOrders.map((order, idx) => {
                const items = order.khakhra_items ?? []
                const preview = items.slice(0, 2).map((it) => it.khakhra_type)
                const dateStr = order.created_at
                  ? format(parseISO(order.created_at), "dd MMM yyyy")
                  : "—"
                return (
                  <div key={order.id}>
                    {idx > 0 ? <Separator className="my-3" /> : null}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm text-muted-foreground">{dateStr}</span>
                        <span className="order-amount font-mono text-base font-semibold tabular-nums">
                          ₹{Number(order.total_amount).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {preview.length === 0 ? (
                          <span className="text-xs text-muted-foreground">No line items</span>
                        ) : (
                          preview.map((name, bi) => (
                            <Badge
                              key={`${name}-${bi}`}
                              variant="outline"
                              className="border-border font-normal text-muted-foreground"
                            >
                              {name}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
