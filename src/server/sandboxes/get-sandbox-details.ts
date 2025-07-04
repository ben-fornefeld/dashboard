import { SUPABASE_AUTH_HEADERS } from '@/configs/api'
import { ERROR_CODES } from '@/configs/logs'
import { authActionClient } from '@/lib/clients/action'
import { infra } from '@/lib/clients/api'
import { l } from '@/lib/clients/logger'
import { handleDefaultInfraError, returnServerError } from '@/lib/utils/action'
import { z } from 'zod'

export const GetSandboxDetailsSchema = z.object({
  teamId: z.string().uuid(),
  sandboxId: z.string().uuid(),
})

export const getSandboxDetails = authActionClient
  .schema(GetSandboxDetailsSchema)
  .metadata({ serverFunctionName: 'getSandboxDetails' })
  .action(async ({ parsedInput, ctx }) => {
    const { session } = ctx
    const { teamId, sandboxId } = parsedInput

    const res = await infra.GET('/sandboxes/{sandboxID}', {
      params: {
        path: {
          sandboxID: sandboxId,
        },
      },
      headers: {
        ...SUPABASE_AUTH_HEADERS(session.access_token, teamId),
      },
    })

    if (res.error) {
      const status = res.response.status

      l.error(
        'GET_SANDBOX_DETAILS',
        ERROR_CODES.INFRA,
        'Failed to get sandbox details',
        {
          error: res.error,
          response: res.response,
        }
      )

      if (status === 404) {
        return returnServerError(
          'Sandbox not found. Please check the sandbox ID and try again.'
        )
      }

      return handleDefaultInfraError(status)
    }

    return res.data
  })
