import { supabase } from "./supabase"

export type Customer = {
  id: string
  shop_name: string
  city: string
  address: string | null
  phone: string | null
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, { ...init, cache: "no-store" })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch (e) {
    console.error("fetchJson", url, e)
    return null
  }
}

// Search customers by shop name — returns top 6 matches
export async function searchCustomers(query: string): Promise<Customer[]> {
  if (!query || query.trim().length < 2) return []

  if (typeof window !== "undefined") {
    const data = await fetchJson<Customer[]>(`/api/customers?q=${encodeURIComponent(query.trim())}`)
    if (Array.isArray(data)) return data
    return []
  }

  const { data, error } = await supabase
    .from("customers")
    .select("id, shop_name, city, address, phone")
    .ilike("shop_name", `%${query}%`)
    .order("shop_name")
    .limit(6)

  if (error) {
    console.error("Customer search error:", error)
    return []
  }
  return data || []
}

// Add a new customer
export async function addCustomer(customer: Omit<Customer, "id">): Promise<Customer | null> {
  if (typeof window !== "undefined") {
    const data = await fetchJson<Customer>("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(customer),
    })
    if (data && "id" in data) return data
    return null
  }

  const { data, error } = await supabase.from("customers").insert(customer).select().single()

  if (error) {
    console.error("Add customer error:", error)
    return null
  }
  return data
}

// Update customer details
export async function updateCustomer(id: string, updates: Partial<Customer>): Promise<void> {
  await supabase
    .from("customers")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
}

/** Case-insensitive match on shop_name + exact city (for deduping after orders). */
export async function findCustomerByShopAndCity(shopName: string, city: string): Promise<Customer | null> {
  const s = shopName.trim()
  const c = city.trim()
  if (!s || !c) return null

  if (typeof window !== "undefined") {
    const params = new URLSearchParams({ shop: s, city: c })
    const data = await fetchJson<Customer | null>(`/api/customers?${params.toString()}`)
    if (data && typeof data === "object" && "id" in data) return data as Customer
    return null
  }

  const { data, error } = await supabase
    .from("customers")
    .select("id, shop_name, city, address, phone")
    .eq("city", c)
    .ilike("shop_name", s)
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error("findCustomerByShopAndCity error:", error)
    return null
  }
  return data
}

export async function fetchAllCustomers(): Promise<Customer[]> {
  if (typeof window !== "undefined") {
    const data = await fetchJson<Customer[]>("/api/customers")
    if (Array.isArray(data)) return data
    return []
  }

  const { data, error } = await supabase
    .from("customers")
    .select("id, shop_name, city, address, phone")
    .order("shop_name")

  if (error) {
    console.error("fetchAllCustomers error:", error)
    return []
  }
  return data || []
}

export async function fetchOrdersForShop(shopName: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("id, shop_name, city, total_amount, created_at, khakhra_items(*)")
    .ilike("shop_name", shopName.trim())
    .order("created_at", { ascending: false })

  if (error) {
    console.error("fetchOrdersForShop error:", error)
    return []
  }
  return data || []
}
