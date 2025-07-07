'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { authActionClient } from '@/lib/clients/action'
import { returnServerError } from '@/lib/utils/action'
import { SUPABASE_AUTH_HEADERS } from '@/configs/api'
import { l } from '@/lib/clients/logger'
import { infra } from '@/lib/clients/api'

// Create API Key

const CreateApiKeySchema = z.object({
  teamId: z.string({ required_error: 'Team ID is required' }).uuid(),
  name: z
    .string({ required_error: 'Name is required' })
    .min(1, 'Name cannot be empty')
    .max(50, 'Name cannot be longer than 50 characters')
    .trim(),
})

export const createApiKeyAction = authActionClient
  .schema(CreateApiKeySchema)
  .metadata({ actionName: 'createApiKey' })
  .action(async ({ parsedInput, ctx }) => {
    const { teamId, name } = parsedInput
    const { session } = ctx

    const accessToken = session.access_token

    const requestBody = {
      name,
    }

    const res = await infra.POST('/api-keys', {
      body: requestBody,
      headers: {
        ...SUPABASE_AUTH_HEADERS(accessToken, teamId),
      },
    })

    if (res.error) {
      l.error('CREATE_API_KEY', 'INFRA - Failed to create API Key', {
        error: res.error,
        teamId,
        requestBody,
        responseStatus: res.response.status,
        responseBody: res.response.body,
      })

      return returnServerError('Failed to create API Key')
    }

    revalidatePath(`/dashboard/[teamIdOrSlug]/keys`, 'page')

    return {
      createdApiKey: res.data,
    }
  })

// Delete API Key

const DeleteApiKeySchema = z.object({
  teamId: z.string({ required_error: 'Team ID is required' }).uuid(),
  apiKeyId: z.string({ required_error: 'API Key ID is required' }).uuid(),
})

export const deleteApiKeyAction = authActionClient
  .schema(DeleteApiKeySchema)
  .metadata({ actionName: 'deleteApiKey' })
  .action(async ({ parsedInput, ctx }) => {
    const { teamId, apiKeyId } = parsedInput
    const { session } = ctx

    const accessToken = session.access_token

    const res = await infra.DELETE('/api-keys/{apiKeyID}', {
      headers: {
        ...SUPABASE_AUTH_HEADERS(accessToken, teamId),
      },
      params: {
        path: {
          apiKeyID: apiKeyId,
        },
      },
    })

    if (res.error) {
      l.error('DELETE_API_KEY', 'INFRA - Failed to delete API Key', {
        error: res.error,
        teamId,
        apiKeyId,
        responseStatus: res.response.status,
        responseBody: res.response.body,
      })

      return returnServerError('Failed to delete API Key')
    }

    revalidatePath(`/dashboard/[teamIdOrSlug]/keys`, 'page')
  })
