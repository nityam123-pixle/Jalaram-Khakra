import { NextResponse } from "next/server"

import { createSupabaseAnonServerClient, createSupabaseServiceClient } from "@/lib/supabase-admin"

const SELECT = "id, shop_name, city, address, phone"

function getServerClient() {
  return createSupabaseServiceClient() ?? createSupabaseAnonServerClient()
}

/** Escape % and _ so user search cannot broaden ILIKE patterns unexpectedly */
function sanitizeIlikeFragment(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_")
}

/**
 * GET /api/customers — list all customers (no query)
 * GET /api/customers?q=ab — search shop_name (min 2 chars), max 6 rows
 * GET /api/customers?shop=x&city=y — single row lookup (dedupe after order)
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q")?.trim() ?? ""
    const shop = searchParams.get("shop")?.trim() ?? ""
    const city = searchParams.get("city")?.trim() ?? ""

    const supabase = getServerClient()

    if (shop && city) {
      const { data, error } = await supabase
        .from("customers")
        .select(SELECT)
        .eq("city", city)
        .ilike("shop_name", shop)
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error("customers lookup error:", error)
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      return NextResponse.json(data)
    }

    if (q.length > 0 && q.length < 2) {
      return NextResponse.json([])
    }

    let query = supabase.from("customers").select(SELECT).order("shop_name")

    if (q.length >= 2) {
      const safe = sanitizeIlikeFragment(q)
      query = query.ilike("shop_name", `%${safe}%`).limit(6)
    }

    const { data, error } = await query

    if (error) {
      console.error("customers fetch error:", error)
      return NextResponse.json(
        {
          error: error.message,
          hint:
            "If rows exist in Supabase but the app shows none: enable SELECT for anon on `customers` (see scripts/fix-customers-rls.sql) or set SUPABASE_SERVICE_ROLE_KEY for API routes.",
        },
        { status: 500 },
      )
    }

    return NextResponse.json(data ?? [])
  } catch (e) {
    console.error("GET /api/customers:", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

/** POST /api/customers — insert (uses service role when set, else anon) */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>
    const supabase = getServerClient()

    const { data, error } = await supabase
      .from("customers")
      .insert({
        shop_name: body.shop_name,
        city: body.city,
        address: body.address ?? null,
        phone: body.phone ?? null,
      })
      .select(SELECT)
      .single()

    if (error) {
      console.error("customers insert error:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (e) {
    console.error("POST /api/customers:", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
