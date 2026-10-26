"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CITIES } from "@/lib/supabase"
import { toast } from "sonner"
import { createCustomer, updateCustomer } from "@/app/actions/customers"

interface CustomerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer?: any | null
  onSuccess: () => void
}

export function CustomerDialog({
  open,
  onOpenChange,
  customer,
  onSuccess,
}: CustomerDialogProps) {
  const isEditing = Boolean(customer)
  const [shopName, setShopName] = useState("")
  const [city, setCity] = useState(CITIES[0] || "")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (customer) {
      setShopName(customer.shop_name || "")
      setCity(customer.city || CITIES[0] || "")
      setPhone(customer.phone || "")
      setAddress(customer.address || "")
    } else {
      setShopName("")
      setCity(CITIES[0] || "")
      setPhone("")
      setAddress("")
    }
  }, [customer, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!shopName.trim() || !city.trim()) {
      toast.error("Shop name and City are required")
      return
    }

    setIsSaving(true)
    try {
      if (isEditing && customer) {
        await updateCustomer(customer.id, {
          shop_name: shopName.trim(),
          city: city.trim(),
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
        })
        toast.success("Customer updated successfully")
      } else {
        await createCustomer({
          shop_name: shopName.trim(),
          city: city.trim(),
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
        })
        toast.success("Customer created successfully")
      }
      onOpenChange(false)
      onSuccess()
    } catch (err: any) {
      toast.error(err.message || "Failed to save customer")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Customer" : "Add New Customer"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update customer details, city location, and contact information."
                : "Register a new business customer into the database."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="shop-name">Shop Name *</Label>
              <Input
                id="shop-name"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="E.g. Shreeji Stores"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger id="city" className="w-full">
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent className="max-h-[250px]">
                  {CITIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address (Optional)</Label>
              <Textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Shop address, street, landmark..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-black hover:bg-neutral-800 text-white dark:bg-white dark:text-black"
            >
              {isSaving ? "Saving..." : isEditing ? "Save Changes" : "Add Customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
