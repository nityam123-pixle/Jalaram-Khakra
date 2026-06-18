import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { IndianRupee, TrendingUp, Calendar, ShoppingCart, MapPin, Users, Package, FileText } from "lucide-react"
import { getExecutiveSummary, getCustomerIntelligence } from "../actions/analytics"
import { getInvoiceStats } from "../actions/invoice"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { SummaryCharts } from "@/components/summary/summary-charts"

export const dynamic = "force-dynamic"

function KPISkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-28 rounded-xl" />
      ))}
    </div>
  )
}

async function ExecutiveKPIs() {
  const summary = await getExecutiveSummary()
  const { kpis } = summary

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <IndianRupee className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{kpis.totalRevenue.toLocaleString('en-IN')}</div>
          <p className="text-xs text-muted-foreground mt-1">Overall lifetime revenue</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">₹{kpis.totalProfit.toLocaleString('en-IN')}</div>
          <p className="text-xs text-muted-foreground mt-1">{kpis.profitMargin.toFixed(1)}% blended margin</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpis.totalOrders}</div>
          <p className="text-xs text-muted-foreground mt-1">₹{Math.round(kpis.aov).toLocaleString('en-IN')} average value</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpis.activeCustomers}</div>
          <p className="text-xs text-muted-foreground mt-1">Across {kpis.citiesServed} cities</p>
        </CardContent>
      </Card>
    </div>
  )
}

async function InvoiceAnalytics() {
  const stats = await getInvoiceStats()

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalInvoices}</div>
          <p className="text-xs text-muted-foreground mt-1">Generated all-time</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
          <TrendingUp className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">₹{stats.outstandingAmount.toLocaleString('en-IN')}</div>
          <p className="text-xs text-muted-foreground mt-1">From {stats.pendingInvoices} pending invoices</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Paid Invoices</CardTitle>
          <IndianRupee className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.paidInvoices}</div>
          <p className="text-xs text-muted-foreground mt-1">Fully settled</p>
        </CardContent>
      </Card>
    </div>
  )
}

async function CustomerInsights() {
  const data = await getCustomerIntelligence()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Top Spenders</CardTitle>
          <CardDescription>Highest lifetime value customers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.topSpenders.map((c: any, i: number) => (
            <div key={c.id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.city}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-600">₹{c.lifetimeRevenue.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-muted-foreground">{c.totalOrders} orders</p>
                </div>
              </div>
              {i < data.topSpenders.length - 1 && <Separator className="my-3" />}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Most Frequent</CardTitle>
          <CardDescription>Highest order volume customers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.mostFrequent.map((c: any, i: number) => (
            <div key={c.id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.city}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{c.totalOrders} orders</p>
                  <p className="text-xs text-muted-foreground">₹{c.lifetimeRevenue.toLocaleString('en-IN')}</p>
                </div>
              </div>
              {i < data.mostFrequent.length - 1 && <Separator className="my-3" />}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export default async function SummaryPage() {
  const summaryData = await getExecutiveSummary();

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Executive Summary</h1>
          <p className="text-muted-foreground mt-1">Real-time business intelligence and KPIs</p>
        </div>
        <Badge variant="outline" className="text-sm w-fit">
          Last updated: {format(new Date(), "PPp")}
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full sm:w-fit grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue & Profit</TabsTrigger>
          <TabsTrigger value="customers">Customers & Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Suspense fallback={<KPISkeleton />}>
            <ExecutiveKPIs />
          </Suspense>

          <SummaryCharts data={summaryData} />
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Category Leaderboard</CardTitle>
              <CardDescription>Detailed breakdown of performance by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50 rounded-lg">
                    <tr>
                      <th className="px-4 py-3 rounded-l-lg">Category</th>
                      <th className="px-4 py-3 text-right">Revenue</th>
                      <th className="px-4 py-3 text-right">Profit</th>
                      <th className="px-4 py-3 text-right">Margin</th>
                      <th className="px-4 py-3 text-right rounded-r-lg">Units Sold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryData.categoryStats.map((cat: any) => (
                      <tr key={cat.category} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{cat.category}</td>
                        <td className="px-4 py-3 text-right font-semibold">₹{cat.revenue.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right text-green-600 font-medium">₹{cat.profit.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right">{cat.margin.toFixed(1)}%</td>
                        <td className="px-4 py-3 text-right">{cat.units}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Invoice Analytics</h2>
            <Suspense fallback={<KPISkeleton />}>
              <InvoiceAnalytics />
            </Suspense>
          </div>
          
          <Separator />

          <div>
            <h2 className="text-xl font-semibold mb-4">Customer Intelligence</h2>
            <Suspense fallback={<KPISkeleton />}>
              <CustomerInsights />
            </Suspense>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
