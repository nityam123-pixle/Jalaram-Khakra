"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getKhakhraTypesByCategory, calculateDynamicProfit } from "@/lib/supabase"
import { Package, IndianRupee, ShoppingBag, TrendingUp } from "lucide-react"

export default function ProductsPage() {
  const { regular, premium, bhakri } = getKhakhraTypesByCategory()

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Products & Pricing</h2>
          <p className="text-muted-foreground">Flexible pricing for all Khakhra varieties and Patra options</p>
        </div>

        {/* Products Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Regular Khakhra - ₹200-225/kg */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Regular Khakhra
              </CardTitle>
              <div className="flex items-center gap-1 text-lg font-semibold text-green-600">
                <IndianRupee className="h-4 w-4" />
                <span>200-225 per kg</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {regular.map((type) => (
                  <div key={type.name} className="p-2 border rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{type.name}</span>
                    </div>
                    <div className="flex flex-col gap-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Price Range:</span>
                        <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                          ₹{type.basePrice}-{type.maxPrice}/kg
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Profit Range:</span>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                          ₹{type.baseProfit}-{calculateDynamicProfit(type, type.maxPrice)}/kg
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Premium Khakhra - ₹210-225/kg */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Premium Khakhra
              </CardTitle>
              <div className="flex items-center gap-1 text-lg font-semibold text-blue-600">
                <IndianRupee className="h-4 w-4" />
                <span>210-225 per kg</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {premium.map((type) => (
                  <div key={type.name} className="p-2 border rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{type.name}</span>
                    </div>
                    <div className="flex flex-col gap-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Price Range:</span>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                          ₹{type.basePrice}-{type.maxPrice}/kg
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Profit Range:</span>
                        <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                          ₹{type.baseProfit}-{calculateDynamicProfit(type, type.maxPrice)}/kg
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Bhakri Options - Flexible pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Bhakri Varieties
              </CardTitle>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1 text-sm font-semibold text-purple-600">
                  <IndianRupee className="h-3 w-3" />
                  <span>45-50 per packet (200g)</span>
                </div>
                <div className="flex items-center gap-1 text-sm font-semibold text-purple-600">
                  <IndianRupee className="h-3 w-3" />
                  <span>225-250 per kg</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {bhakri.map((type) => (
                  <div key={type.name} className="p-2 border rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{type.name}</span>
                    </div>
                    <div className="flex flex-col gap-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Per packet:</span>
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 text-xs">
                          ₹{type.basePacketPrice}-{type.maxPacketPrice}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Per kg:</span>
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 text-xs">
                          ₹{type.basePrice}-{type.maxPrice}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Profit/packet:</span>
                        <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                          ₹{type.basePacketProfit}-{calculateDynamicProfit(type, type.maxPacketPrice!, true)}
                        </Badge>
                      </div>
                    </div>
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
                <span>75-85 per packet</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 border rounded-lg">
                  <div>
                    <span className="font-medium">Traditional Patra</span>
                    <p className="text-sm text-muted-foreground">Classic steamed patra packets</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 mb-1">
                      ₹80-85/packet
                    </Badge>
                    <div className="text-xs text-muted-foreground">Profit: ₹11-16</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pricing Strategy Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <TrendingUp className="h-5 w-5" />
              Dynamic Pricing Strategy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                <h4 className="font-semibold mb-2">Regular Khakhra</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Base: ₹200/kg (₹20 profit)</li>
                  <li>• Max: ₹225/kg (₹45 profit)</li>
                  <li>• +₹1 profit per ₹1 price increase</li>
                </ul>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                <h4 className="font-semibold mb-2">Premium Khakhra</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Base: ₹210/kg (₹25 profit)</li>
                  <li>• Max: ₹225/kg (₹40 profit)</li>
                  <li>• +₹1 profit per ₹1 price increase</li>
                </ul>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                <h4 className="font-semibold mb-2">Bhakri Varieties</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Base: ₹45/packet (₹7 profit)</li>
                  <li>• Max: ₹50/packet (₹12 profit)</li>
                  <li>• +₹1 profit per ₹1 price increase</li>
                </ul>
              </div>
            </div>
            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Flexible Pricing:</strong> Adjust prices based on market conditions, customer relationships, and
                order quantities. Higher prices = Higher profits automatically calculated!
              </p>
            </div>
          </CardContent>
        </Card>

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
      </div>
    </div>
  )
}
