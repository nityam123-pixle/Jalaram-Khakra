"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line } from "recharts"
import { MonthlyOrdersSheet } from "./monthly-orders-sheet"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export function SummaryCharts({ data }: { data: any }) {
  const { categoryStats, monthlyPerformance } = data;
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Category</CardTitle>
            <CardDescription>Contribution to overall revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryStats}
                    dataKey="revenue"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryStats.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profit by Category</CardTitle>
            <CardDescription>Contribution to overall profit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryStats}
                    dataKey="profit"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#82ca9d"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryStats.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Performance</CardTitle>
          <CardDescription>Revenue and Profit trends over the last 12 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyPerformance}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                onClick={(state) => {
                  if (state && state.activePayload && state.activePayload.length > 0) {
                    setSelectedMonth(state.activePayload[0].payload.monthKey);
                  }
                }}
                className="cursor-pointer"
              >
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" tickFormatter={(value) => `₹${(value/1000).toFixed(0)}k`} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value}`} />
                <Tooltip formatter={(value: number, name: string) => [
                  name === 'orders' ? value : `₹${value.toLocaleString('en-IN')}`, 
                  name.charAt(0).toUpperCase() + name.slice(1)
                ]} />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#0088FE" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="left" dataKey="profit" name="Profit" fill="#00C49F" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="orders" name="Orders" stroke="#ff7300" strokeWidth={3} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <MonthlyOrdersSheet 
        monthKey={selectedMonth} 
        onClose={() => setSelectedMonth(null)} 
      />
    </div>
  )
}
