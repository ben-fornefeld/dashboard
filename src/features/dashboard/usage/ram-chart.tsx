'use client'

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/ui/primitives/chart'
import { Area, AreaChart, XAxis, YAxis } from 'recharts'
import {
  chartConfig,
  commonChartProps,
  commonXAxisProps,
  commonYAxisProps,
} from './chart-config'

type ChartData = {
  x: string
  y: number
}[]

export function RAMChart({ data }: { data: ChartData }) {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-36">
      <AreaChart data={data} {...commonChartProps}>
        <defs>
          <linearGradient id="ram" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-ram)" stopOpacity={0.2} />
            <stop offset="100%" stopColor="var(--color-ram)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="x" {...commonXAxisProps} />
        <YAxis {...commonYAxisProps} />
        <ChartTooltip
          content={({ active, payload }) => {
            if (!active || !payload) return null
            return (
              <ChartTooltipContent
                formatter={(value) => [
                  <span key="value">{Number(value).toFixed(2)}</span>,
                  'RAM Hours',
                ]}
                payload={payload}
                active={active}
              />
            )
          }}
        />
        <Area
          type="monotone"
          dataKey="y"
          stroke="var(--color-ram)"
          strokeWidth={2}
          fill="url(#ram)"
        />
      </AreaChart>
    </ChartContainer>
  )
}
