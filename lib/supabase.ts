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
  patra_price_per_packet?: number
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
  // New fields for packet-based items
  is_packet_item?: boolean
  packet_quantity?: number
  price_per_packet?: number
}

// Updated Khakhra types with dynamic pricing ranges and new Farali category
export const KHAKHRA_TYPES = [
  // Regular Khakhra - ₹200-225/kg (profit: ₹20-45)
  {
    name: "Methi",
    category: "regular" as const,
    basePrice: 200,
    maxPrice: 225,
    baseProfit: 20,
    sellBy: "kg" as const,
  },
  {
    name: "Masala",
    category: "regular" as const,
    basePrice: 200,
    maxPrice: 225,
    baseProfit: 20,
    sellBy: "kg" as const,
  },
  {
    name: "Methi Masala",
    category: "regular" as const,
    basePrice: 200,
    maxPrice: 225,
    baseProfit: 20,
    sellBy: "kg" as const,
  },
  {
    name: "Jeera",
    category: "regular" as const,
    basePrice: 200,
    maxPrice: 225,
    baseProfit: 20,
    sellBy: "kg" as const,
  },
  {
    name: "Sada",
    category: "regular" as const,
    basePrice: 200,
    maxPrice: 225,
    baseProfit: 20,
    sellBy: "kg" as const,
  },
  {
    name: "Chat",
    category: "regular" as const,
    basePrice: 200,
    maxPrice: 225,
    baseProfit: 20,
    sellBy: "kg" as const,
  },
  {
    name: "Mangroli",
    category: "regular" as const,
    basePrice: 200,
    maxPrice: 225,
    baseProfit: 20,
    sellBy: "kg" as const,
  },
  {
    name: "Lasan Methi",
    category: "regular" as const,
    basePrice: 200,
    maxPrice: 225,
    baseProfit: 20,
    sellBy: "kg" as const,
  },
  {
    name: "Bajri Methi",
    category: "regular" as const,
    basePrice: 200,
    maxPrice: 225,
    baseProfit: 20,
    sellBy: "kg" as const,
  },
  {
    name: "Bajri Lasan",
    category: "regular" as const,
    basePrice: 200,
    maxPrice: 225,
    baseProfit: 20,
    sellBy: "kg" as const,
  },
  {
    name: "Dahi Methi",
    category: "regular" as const,
    basePrice: 200,
    maxPrice: 225,
    baseProfit: 20,
    sellBy: "kg" as const,
  },
  {
    name: "Dhaniya Mirchi",
    category: "regular" as const,
    basePrice: 200,
    maxPrice: 225,
    baseProfit: 20,
    sellBy: "kg" as const,
  },

  // Premium Khakhra - ₹210-225/kg (profit: ₹25-40)
  {
    name: "Chana Chatpata",
    category: "premium" as const,
    basePrice: 210,
    maxPrice: 225,
    baseProfit: 25,
    sellBy: "kg" as const,
  },
  {
    name: "Panipuri",
    category: "premium" as const,
    basePrice: 210,
    maxPrice: 225,
    baseProfit: 25,
    sellBy: "kg" as const,
  },
  {
    name: "Manchurian",
    category: "premium" as const,
    basePrice: 210,
    maxPrice: 225,
    baseProfit: 25,
    sellBy: "kg" as const,
  },
  {
    name: "Peri peri",
    category: "premium" as const,
    basePrice: 210,
    maxPrice: 225,
    baseProfit: 25,
    sellBy: "kg" as const,
  },
  {
    name: "Tometo cheese",
    category: "premium" as const,
    basePrice: 210,
    maxPrice: 225,
    baseProfit: 25,
    sellBy: "kg" as const,
  },
  {
    name: "Cheese Piza",
    category: "premium" as const,
    basePrice: 210,
    maxPrice: 225,
    baseProfit: 25,
    sellBy: "kg" as const,
  },
  {
    name: "Ragi",
    category: "premium" as const,
    basePrice: 210,
    maxPrice: 225,
    baseProfit: 25,
    sellBy: "kg" as const,
  },
  {
    name: "Aachar Masala",
    category: "premium" as const,
    basePrice: 210,
    maxPrice: 225,
    baseProfit: 25,
    sellBy: "kg" as const,
  },

  // Bhakri varieties - ₹45-50 per packet (profit: ₹7-12 per packet)
  {
    name: "Methi Bhakri",
    category: "bhakri" as const,
    basePrice: 225, // ₹45 per 200g = ₹225 per kg
    maxPrice: 250, // ₹50 per 200g = ₹250 per kg
    baseProfit: 35, // ₹7 per 200g = ₹35 per kg (₹45-₹38=₹7 profit per 200g)
    sellBy: "both" as const,
    basePacketPrice: 45,
    maxPacketPrice: 50,
    basePacketProfit: 7, // ₹45 - ₹38 = ₹7
  },
  {
    name: "Masala Bhakri",
    category: "bhakri" as const,
    basePrice: 225,
    maxPrice: 250,
    baseProfit: 35,
    sellBy: "both" as const,
    basePacketPrice: 45,
    maxPacketPrice: 50,
    basePacketProfit: 7,
  },
  {
    name: "Jeera Bhakri",
    category: "bhakri" as const,
    basePrice: 225,
    maxPrice: 250,
    baseProfit: 35,
    sellBy: "both" as const,
    basePacketPrice: 45,
    maxPacketPrice: 50,
    basePacketProfit: 7,
  },
  {
    name: "Lasan Bhakri",
    category: "bhakri" as const,
    basePrice: 225,
    maxPrice: 250,
    baseProfit: 35,
    sellBy: "both" as const,
    basePacketPrice: 45,
    maxPacketPrice: 50,
    basePacketProfit: 7,
  },

  // NEW: Farali Khakhra - sold by packets (200g) or kg
  {
    name: "Farali Khakhra Regular",
    category: "farali" as const,
    basePacketPrice: 45, // Selling price
    maxPacketPrice: 50, // Assuming a range for flexibility
    basePacketCost: 40, // Our price
    basePacketProfit: 5, // 45 - 40 = 5
    basePrice: 225, // 45 * 5 packets/kg = 225
    maxPrice: 250, // 50 * 5 packets/kg = 250
    baseProfit: 25, // 5 * 5 packets/kg = 25
    sellBy: "both" as const,
  },
  {
    name: "Farali Khakhra Masala",
    category: "farali" as const,
    basePacketPrice: 45,
    maxPacketPrice: 50,
    basePacketCost: 40,
    basePacketProfit: 5,
    basePrice: 225,
    maxPrice: 250,
    baseProfit: 25,
    sellBy: "both" as const,
  },
  {
    name: "Farali Bhakari Container",
    category: "farali" as const,
    basePacketPrice: 60, // Selling price
    maxPacketPrice: 65, // Assuming a range for flexibility
    basePacketCost: 55, // Our price
    basePacketProfit: 5, // 60 - 55 = 5
    basePrice: 300, // 60 * 5 packets/kg = 300
    maxPrice: 325, // 65 * 5 packets/kg = 325
    baseProfit: 25, // 5 * 5 packets/kg = 25
    sellBy: "both" as const,
  },
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
export const PATRA_PRICE_MIN = 80 // Updated min price to match DB constraint
export const PATRA_PRICE_MAX = 85 // Updated max price
export const PATRA_PRICE = 80 // Default price, still within range

// Helper functions for dynamic pricing
export const calculateDynamicProfit = (
  khakhraType: (typeof KHAKHRA_TYPES)[0],
  actualPrice: number,
  isPacket = false,
): number => {
  if (isPacket && (khakhraType.category === "bhakri" || khakhraType.category === "farali")) {
    // For packet-based Bhakri/Farali: profit increases by ₹1 for every ₹1 increase from base packet price
    const basePacketPrice = khakhraType.basePacketPrice || 0
    const basePacketProfit = khakhraType.basePacketProfit || 0
    return basePacketProfit + (actualPrice - basePacketPrice)
  } else {
    // For kg-based items: profit increases by ₹1 for every ₹1 increase from base price
    return khakhraType.baseProfit + (actualPrice - khakhraType.basePrice)
  }
}

export const getPriceRange = (khakhraType: (typeof KHAKHRA_TYPES)[0], isPacket = false): number[] => {
  if (isPacket && (khakhraType.category === "bhakri" || khakhraType.category === "farali")) {
    const basePacketPrice = khakhraType.basePacketPrice || 0
    const maxPacketPrice = khakhraType.maxPacketPrice || 0
    return Array.from({ length: maxPacketPrice - basePacketPrice + 1 }, (_, i) => basePacketPrice + i)
  } else {
    return Array.from({ length: khakhraType.maxPrice - khakhraType.basePrice + 1 }, (_, i) => khakhraType.basePrice + i)
  }
}

// Add dynamic patra profit calculation function
export const calculatePatraProfit = (pricePerPacket: number): number => {
  // Assuming cost of Patra is 64. Profit = price - cost.
  // At 80, profit = 80 - 68 = 12 (new base)
  // At 85, profit = 85 - 68 = 17
  // Profit increases by 1 for every 1 rupee increase in price.
  const basePatraPrice = 80 // Updated base price for profit calculation
  const basePatraProfit = 12 // Updated base profit for 80
  return basePatraProfit + (pricePerPacket - basePatraPrice)
}

// Update the calculateOrderProfit function to return separate profits
export const calculateOrderProfit = (
  order: Order,
): { khakhraProfit: number; patraProfit: number; totalProfit: number } => {
  let khakhraProfit = 0
  let patraProfit = 0

  // Calculate khakhra profit with dynamic pricing
  if (order.khakhra_items) {
    khakhraProfit += order.khakhra_items.reduce((sum, item) => {
      const khakhraType = KHAKHRA_TYPES.find((k) => k.name === item.khakhra_type)

      if (!khakhraType) return sum

      // Check if this is a packet-based item
      if (item.is_packet_item && item.packet_quantity && item.price_per_packet) {
        const packetProfit = calculateDynamicProfit(khakhraType, item.price_per_packet, true)
        return sum + item.packet_quantity * packetProfit
      } else {
        // Regular kg-based calculation with dynamic pricing
        const kgProfit = calculateDynamicProfit(khakhraType, item.price_per_kg, false)
        return sum + item.quantity_kg * kgProfit
      }
    }, 0)
  }

  // Add patra profit with dynamic calculation
  if (order.wants_patra) {
    const patraPrice = order.patra_price_per_packet || PATRA_PRICE_MIN
    const profitPerPacket = calculatePatraProfit(patraPrice)
    patraProfit += order.patra_packets * profitPerPacket
  }

  return { khakhraProfit, patraProfit, totalProfit: khakhraProfit + patraProfit }
}

// Helper function to get khakhra types by category
export const getKhakhraTypesByCategory = () => {
  const regular = KHAKHRA_TYPES.filter((k) => k.category === "regular")
  const premium = KHAKHRA_TYPES.filter((k) => k.category === "premium")
  const bhakri = KHAKHRA_TYPES.filter((k) => k.category === "bhakri")
  const farali = KHAKHRA_TYPES.filter((k) => k.category === "farali")

  return { regular, premium, bhakri, farali }
}

// Helper function to calculate packet equivalent
export const convertKgToPackets = (kg: number): number => {
  return Math.round(kg * 5) // 1kg = 5 packets of 200g
}

export const convertPacketsToKg = (packets: number): number => {
  return packets * 0.2 // 1 packet (200g) = 0.2kg
}
