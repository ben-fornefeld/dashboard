import { AUTH_URLS, PROTECTED_URLS } from '@/configs/urls'
import { l } from '@/lib/clients/logger'
import { createClient } from '@/lib/clients/supabase/server'
import { encodedRedirect } from '@/lib/utils/auth'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the SSR package. It exchanges an auth code for the user's session.
  // https://supabase.com/docs/guides/auth/server-side/nextjs

  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin
  const returnTo = requestUrl.searchParams.get('returnTo')?.toString()
  const redirectTo = requestUrl.searchParams.get('redirect_to')?.toString()

  l.debug('AUTH_CALLBACK', 'Auth callback:', {
    code: !!code,
    origin,
    returnTo,
    redirectTo,
  })

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      l.error(
        'AUTH_CALLBACK',
        'SUPABASE - Failed to exchange code for session',
        {
          error,
          origin,
          returnTo,
          redirectTo,
        }
      )
      throw encodedRedirect('error', AUTH_URLS.SIGN_IN, error.message)
    } else {
      l.info('AUTH_CALLBACK', 'OTP was successfully exchanged for user', {
        userId: data.user.id,
      })
    }
  }

  if (redirectTo) {
    const returnToUrl = new URL(redirectTo, origin)
    if (returnToUrl.origin === origin) {
      l.debug('AUTH_CALLBACK', 'Redirecting to:', {
        redirectTo,
        origin,
        returnTo,
      })
      return redirect(redirectTo)
    }
  }

  if (returnTo) {
    const returnToUrl = new URL(returnTo, origin)
    if (returnToUrl.origin === origin) {
      l.debug('AUTH_CALLBACK', 'Returning to:', {
        returnTo,
      })
      return redirect(returnTo)
    }
  }

  l.debug('AUTH_CALLBACK', 'Redirecting to dashboard')
  return redirect(PROTECTED_URLS.DASHBOARD)
}
