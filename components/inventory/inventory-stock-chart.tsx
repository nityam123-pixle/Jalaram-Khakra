"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface Props {
  data: { date: string; stockIn: number; stockOut: number }[]
}

export function InventoryStockChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => v.slice(5)} // MM-DD
        />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid hsl(var(--border))",
            background: "hsl(var(--background))",
            fontSize: "12px",
          }}
        />
        <Legend iconType="circle" iconSize={8} />
        <Bar dataKey="stockIn" name="Stock In" fill="#10b981" radius={[3, 3, 0, 0]} />
        <Bar dataKey="stockOut" name="Stock Out" fill="#ef4444" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
