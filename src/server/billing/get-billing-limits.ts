import 'server-only'

import { SUPABASE_AUTH_HEADERS } from '@/configs/api'
import { authActionClient } from '@/lib/clients/action'
import { l } from '@/lib/clients/logger'
import { BillingLimit } from '@/types/billing'
import { z } from 'zod'

const GetBillingLimitsParamsSchema = z.object({
  teamId: z.string().uuid(),
})

export const getBillingLimits = authActionClient
  .schema(GetBillingLimitsParamsSchema)
  .metadata({ serverFunctionName: 'getBillingLimits' })
  .action(async ({ parsedInput, ctx }) => {
    const { teamId } = parsedInput
    const { session } = ctx

    const res = await fetch(
      `${process.env.BILLING_API_URL}/teams/${teamId}/billing-limits`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...SUPABASE_AUTH_HEADERS(session.access_token),
        },
      }
    )

    if (!res.ok) {
      const body = await res.text()

      l.error('GET_BILLING_LIMITS', 'BILLING - Failed to get billing limits', {
        teamId,
        responseStatus: res.status,
        responseBody: body,
      })

      throw new Error(body)
    }

    const limit = (await res.json()) as BillingLimit

    return limit
  })
