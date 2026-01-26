'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'

interface StatsCardProps {
  title: string
  value: string | number
  change: number
  trend: Array<{ value: number }>
  color: string
}

export function StatsCard({ title, value, change, trend, color }: StatsCardProps) {
  const isPositive = change >= 0
  const chartConfig = {
    value: {
      label: title,
      color: color,
    },
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <div className="text-2xl font-bold">{value}</div>
          <div className={`flex items-center gap-1 text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            <span>{isPositive ? '+' : ''}{change.toFixed(2)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
