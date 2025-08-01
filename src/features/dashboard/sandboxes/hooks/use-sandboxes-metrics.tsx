'use client'

import { MOCK_METRICS_DATA } from '@/configs/mock-data'
import { useSelectedTeam } from '@/lib/hooks/use-teams'
import { Sandboxes } from '@/types/api'
import { ClientSandboxesMetrics } from '@/types/sandboxes.types'
import { useEffect } from 'react'
import useSWR from 'swr'
import { useSandboxMetricsStore } from '../stores/metrics-store'

interface MetricsResponse {
  metrics: ClientSandboxesMetrics
  error?: string
}

interface UseSandboxesMetricsProps {
  sandboxes: Sandboxes
  initialMetrics?: ClientSandboxesMetrics | null
  pollingInterval?: number
}

export function useSandboxesMetrics({
  sandboxes,
  initialMetrics = null,
  pollingInterval,
}: UseSandboxesMetricsProps) {
  const teamId = useSelectedTeam()?.id

  const sandboxIds = sandboxes.map((sbx) => sbx.sandboxID)

  const { data, error, isLoading } = useSWR<MetricsResponse>(
    sandboxIds.length > 0
      ? [`/api/teams/${teamId}/sandboxes/metrics`, sandboxIds]
      : null,
    async ([url]) => {
      if (sandboxIds.length === 0) {
        return {
          metrics: initialMetrics ?? {},
        }
      }

      if (process.env.NEXT_PUBLIC_MOCK_DATA === '1') {
        return MOCK_METRICS_DATA(sandboxes)
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sandboxIds }),
        cache: 'no-store',
      })

      if (!response.ok) {
        const { error } = await response.json()

        throw new Error(error || 'Failed to fetch metrics')
      }

      return (await response.json()) as MetricsResponse
    },
    {
      refreshInterval: pollingInterval,
      errorRetryInterval: 2000,
      errorRetryCount: 3,
      revalidateOnMount: true,
      revalidateIfStale: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      fallbackData: initialMetrics ? { metrics: initialMetrics } : undefined,
    }
  )

  const setMetrics = useSandboxMetricsStore((s) => s.setMetrics)

  useEffect(() => {
    if (data?.metrics) {
      setMetrics(data.metrics)
    }
  }, [data?.metrics, setMetrics])

  return {
    metrics: data?.metrics ?? null,
    error,
    isLoading,
  }
}
