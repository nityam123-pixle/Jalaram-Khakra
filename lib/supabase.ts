import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://gpynpjedcwbbpkyyuvga.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdweW5wamVkY3diYnBreXl1dmdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2ODYxMjIsImV4cCI6MjA2NjI2MjEyMn0.RwPy2ttONchySm3eaVgmhOsMd5eT1SKGOThRevDMJ2k"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Order = {
  id: string
  shop_name: string
  address: string
  city: string
  status: "pending" | "completed"
  wants_patra: boolean
  patra_packets: number
  patra_price_per_packet?: number // Made optional for backward compatibility
  total_khakhra_kg: number
  total_amount: number
  created_at: string
  updated_at: string
  khakhra_items?: KhakhraItem[]
}

export type KhakhraItem = {
  id: string
  order_id: string
  khakhra_type: string
  quantity_kg: number
  price_per_kg: number
  total_price: number
  created_at: string
}

// Updated Khakhra types with pricing and profit margins
export const KHAKHRA_TYPES = [
  { name: "Methi", price: 200, profit: 20 },
  { name: "Masala", price: 200, profit: 20 },
  { name: "Methi Masala", price: 200, profit: 20 },
  { name: "Jeera", price: 200, profit: 20 },
  { name: "Sada", price: 200, profit: 20 },
  { name: "Chat", price: 200, profit: 20 },
  { name: "Mangroli", price: 200, profit: 20 },
  { name: "Lasan Methi", price: 200, profit: 20 },
  { name: "Bajri Methi", price: 200, profit: 20 },
  { name: "Bajri Lasan", price: 200, profit: 20 },
  { name: "Dahi Methi", price: 200, profit: 20 },
  { name: "Dhaniya Mirchi", price: 200, profit: 20 },
  { name: "Chana Chatpata", price: 210, profit: 25 },
  { name: "Panipuri", price: 210, profit: 25 },
  { name: "Manchurian", price: 210, profit: 25 },
  { name: "Peri peri", price: 210, profit: 25 },
  { name: "Tometo cheese", price: 210, profit: 25 },
  { name: "Cheese Piza", price: 210, profit: 25 },
  { name: "Ragi", price: 210, profit: 25 },
  { name: "Aachar Masala", price: 210, profit: 25 },
]

// Updated cities for your father's business coverage
export const CITIES = [
  "Ahmedabad",
  "Amreli",
  "Lathi",
  "Gadhada",
  "Bagasara",
  "Savarkundla",
  "Dhari",
  "Vadiya",
  "Kukavav",
  "Derdi",
  "Damnagar",
  "Botad",
  "Palitana",
  "Jasdan",
  "Kotadapitha",
  "Aatkot",
  "Babra",
  "Chittal",
  "Monpar",
  "Barwala",
]

// Patra pricing range
export const PATRA_PRICE_MIN = 80
export const PATRA_PRICE_MAX = 85
export const PATRA_PRICE = 80

// Remove the fixed PATRA_PROFIT_PER_PACKET constant and replace with a function
// export const PATRA_PROFIT_PER_PACKET = 11 // Remove this line

// Add dynamic patra profit calculation function
export const calculatePatraProfit = (pricePerPacket: number): number => {
  if (pricePerPacket <= 80) return 11
  if (pricePerPacket >= 85) return 16
  // Linear interpolation for prices between 80-85
  return Math.round(11 + ((pricePerPacket - 80) / 5) * 5)
}

// Update the calculateOrderProfit function to use dynamic patra profit
export const calculateOrderProfit = (order: Order): number => {
  let profit = 0

  // Calculate khakhra profit
  if (order.khakhra_items) {
    profit += order.khakhra_items.reduce((sum, item) => {
      const khakhraType = KHAKHRA_TYPES.find((k) => k.name === item.khakhra_type)
      return sum + item.quantity_kg * (khakhraType?.profit || 0)
    }, 0)
  }

  // Add patra profit with dynamic calculation
  if (order.wants_patra) {
    const patraPrice = order.patra_price_per_packet || 80
    const profitPerPacket = calculatePatraProfit(patraPrice)
    profit += order.patra_packets * profitPerPacket
  }

  return profit
}
