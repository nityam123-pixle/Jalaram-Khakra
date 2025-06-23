"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { KHAKHRA_TYPES, PATRA_PRICE } from "@/lib/supabase"
import { Package, IndianRupee } from "lucide-react"

export default function ProductsPage() {
  const regularKhakhra = KHAKHRA_TYPES.filter((k) => k.price === 200)
  const premiumKhakhra = KHAKHRA_TYPES.filter((k) => k.price === 210)

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Products & Pricing</h2>
        <p className="text-muted-foreground">Complete list of available Khakhra varieties and Patra options</p>
      </div>

      {/* Products Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Regular Khakhra - ₹200/kg */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Regular Khakhra
            </CardTitle>
            <div className="flex items-center gap-1 text-lg font-semibold text-green-600">
              <IndianRupee className="h-4 w-4" />
              <span>200 per kg</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {regularKhakhra.map((type) => (
                <div key={type.name} className="flex items-center justify-between p-2 border rounded-lg">
                  <span className="font-medium">{type.name}</span>
                  <Badge variant="outline">₹{type.price}/kg</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Premium Khakhra - ₹210/kg */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Premium Khakhra
            </CardTitle>
            <div className="flex items-center gap-1 text-lg font-semibold text-blue-600">
              <IndianRupee className="h-4 w-4" />
              <span>210 per kg</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {premiumKhakhra.map((type) => (
                <div key={type.name} className="flex items-center justify-between p-2 border rounded-lg">
                  <span className="font-medium">{type.name}</span>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    ₹{type.price}/kg
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Patra Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Patra Options
            </CardTitle>
            <div className="flex items-center gap-1 text-lg font-semibold text-orange-600">
              <IndianRupee className="h-4 w-4" />
              <span>{PATRA_PRICE} per packet</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 border rounded-lg">
                <div>
                  <span className="font-medium">Traditional Patra</span>
                  <p className="text-sm text-muted-foreground">Classic steamed patra packets</p>
                </div>
                <Badge variant="outline" className="bg-orange-50 text-orange-700">
                  ₹{PATRA_PRICE}/packet
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Business Coverage */}
      <Card>
        <CardHeader>
          <CardTitle>Business Coverage Areas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {[
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
            ].map((city) => (
              <Badge key={city} variant="secondary" className="justify-center">
                {city}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Product Information */}
      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Khakhra Varieties</h4>
            <p className="text-sm text-muted-foreground">
              Traditional Gujarati crispy flatbread made from wheat flour and spices. Available in 20 different flavors
              with two pricing tiers:
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>
                • <strong>Regular (₹200/kg):</strong> Traditional flavors like Methi, Masala, Jeera, Sada, etc.
              </li>
              <li>
                • <strong>Premium (₹210/kg):</strong> Special flavors like Chana Chatpata, Panipuri, Peri Peri, Cheese
                varieties, etc.
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Patra</h4>
            <p className="text-sm text-muted-foreground">
              Steamed and sliced colocasia leaves rolls with spiced gram flour paste. Sold at ₹{PATRA_PRICE} per packet.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
