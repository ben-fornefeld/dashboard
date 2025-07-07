import 'server-only'

import { SUPABASE_AUTH_HEADERS } from '@/configs/api'
import { authActionClient } from '@/lib/clients/action'
import { l } from '@/lib/clients/logger'
import { Invoice } from '@/types/billing'
import { z } from 'zod'

const GetInvoicesParamsSchema = z.object({
  teamId: z.string().uuid(),
})

export const getInvoices = authActionClient
  .schema(GetInvoicesParamsSchema)
  .metadata({ serverFunctionName: 'getInvoices' })
  .action(async ({ parsedInput, ctx }) => {
    const { teamId } = parsedInput
    const { session } = ctx

    const res = await fetch(
      `${process.env.BILLING_API_URL}/teams/${teamId}/invoices`,
      {
        headers: {
          ...SUPABASE_AUTH_HEADERS(session.access_token, teamId),
        },
      }
    )

    if (!res.ok) {
      const body = await res.text()

      l.error('GET_INVOICES', 'BILLING - Failed to get invoices', {
        teamId,
        responseStatus: res.status,
        responseBody: body,
      })

      throw new Error(body)
    }

    const invoices = (await res.json()) as Invoice[]

    return invoices
  })
