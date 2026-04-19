"use client"

import { useCallback, useEffect, useId, useRef, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addCustomer, searchCustomers, type Customer } from "@/lib/customers"
import { CITIES } from "@/lib/supabase"
import { cn } from "@/lib/utils"

export interface CustomerSearchInputProps {
  id?: string
  value: string
  onChange: (value: string) => void
  onCustomerSelect: (customer: Customer) => void
  placeholder?: string
  className?: string
}

function addressPreview(address: string | null, maxLen = 48) {
  if (!address?.trim()) return ""
  const t = address.trim().replace(/\s+/g, " ")
  return t.length > maxLen ? `${t.slice(0, maxLen)}…` : t
}

export function CustomerSearchInput({
  id: idProp,
  value,
  onChange,
  onCustomerSelect,
  placeholder = "Enter shop name",
  className,
}: CustomerSearchInputProps) {
  const genId = useId()
  const id = idProp ?? genId
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Customer[]>([])
  const [highlighted, setHighlighted] = useState(-1)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newPhone, setNewPhone] = useState("")
  const [newCity, setNewCity] = useState(CITIES[0] ?? "")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const trimmed = value.trim()
  const showAddHint = trimmed.length >= 2 && !loading && !showAddForm && results.length === 0

  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      const data = await searchCustomers(q)
      setResults(data)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void runSearch(value)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [value, runSearch])

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
        setShowAddForm(false)
        setHighlighted(-1)
      }
    }
    document.addEventListener("mousedown", onDocMouseDown)
    return () => document.removeEventListener("mousedown", onDocMouseDown)
  }, [])

  const selectCustomer = (c: Customer) => {
    onChange(c.shop_name)
    onCustomerSelect(c)
    setOpen(false)
    setShowAddForm(false)
    setHighlighted(-1)
  }

  const navigableCount = results.length + (showAddHint ? 1 : 0)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp") && trimmed.length >= 2) {
      setOpen(true)
    }

    if (e.key === "Escape") {
      if (showAddForm) {
        setShowAddForm(false)
        setNewPhone("")
        setNewCity(CITIES[0] ?? "")
        e.stopPropagation()
        return
      }
      setOpen(false)
      setHighlighted(-1)
      return
    }

    if (!open || showAddForm) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlighted((h) => (navigableCount === 0 ? -1 : (h + 1) % navigableCount))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlighted((h) =>
        navigableCount === 0 ? -1 : (h - 1 + navigableCount) % navigableCount,
      )
    } else if (e.key === "Enter") {
      if (highlighted < 0) return
      e.preventDefault()
      if (highlighted < results.length) {
        selectCustomer(results[highlighted])
      } else if (showAddHint) {
        setShowAddForm(true)
        setHighlighted(-1)
      }
    }
  }

  const handleSaveNew = async () => {
    const name = value.trim()
    if (!name) {
      toast.error("Enter a shop name first")
      return
    }
    if (!newCity) {
      toast.error("Select a city")
      return
    }
    const created = await addCustomer({
      shop_name: name,
      city: newCity,
      address: null,
      phone: newPhone.trim() || null,
    })
    if (!created) {
      toast.error("Could not save customer")
      return
    }
    toast.success("Customer saved!")
    selectCustomer(created)
    setNewPhone("")
    setNewCity(CITIES[0] ?? "")
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <Input
        ref={inputRef}
        id={id}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
          setHighlighted(-1)
          setShowAddForm(false)
        }}
        onFocus={() => {
          if (trimmed.length >= 2) setOpen(true)
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        required
      />

      {open && trimmed.length >= 2 && (
        <div
          className="absolute left-0 right-0 z-50 mt-1 max-h-[280px] overflow-y-auto rounded-lg border border-border bg-popover shadow-md"
          role="listbox"
        >
          {loading && (
            <div className="px-3 py-2.5 text-sm text-muted-foreground">Searching…</div>
          )}

          {!loading &&
            results.map((c, i) => (
              <button
                key={c.id}
                type="button"
                role="option"
                aria-selected={highlighted === i}
                className={cn(
                  "flex w-full flex-col gap-0.5 px-3 py-2.5 text-left text-sm hover:bg-accent",
                  highlighted === i && "bg-accent",
                )}
                onMouseEnter={() => setHighlighted(i)}
                onClick={() => selectCustomer(c)}
              >
                <span className="font-medium">{c.shop_name}</span>
                <span className="text-xs text-muted-foreground">
                  {c.city}
                  {addressPreview(c.address) ? ` · ${addressPreview(c.address)}` : ""}
                </span>
              </button>
            ))}

          {!loading && showAddHint && (
            <button
              type="button"
              role="option"
              className={cn(
                "w-full px-3 py-2.5 text-left text-sm hover:bg-accent",
                highlighted === results.length && "bg-accent",
              )}
              onMouseEnter={() => setHighlighted(results.length)}
              onClick={() => {
                setShowAddForm(true)
                setHighlighted(-1)
              }}
            >
              No customer found — Add as new customer
            </button>
          )}

          {showAddForm && (
            <div className="space-y-2 border-t border-border p-3">
              <div className="space-y-1.5">
                <Label className="text-xs">City *</Label>
                <Select value={newCity} onValueChange={setNewCity}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {CITIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Phone number (optional)</Label>
                <Input
                  placeholder="Phone number (optional)"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="h-9"
                />
              </div>
              <Button type="button" size="sm" className="w-full" onClick={() => void handleSaveNew()}>
                Save &amp; Select
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => {
                  setShowAddForm(false)
                  setNewPhone("")
                  setNewCity(CITIES[0] ?? "")
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
