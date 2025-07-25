import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { ALLOW_SEO_INDEXING } from './configs/flags'
import { l } from './lib/clients/logger'
import { getRewriteForPath } from './lib/utils/rewrites'
import {
  getAuthRedirect,
  getUserSession,
  handleTeamResolution,
  isDashboardRoute,
  resolveTeamForDashboard,
} from './server/middleware'

export async function middleware(request: NextRequest) {
  try {
    l.debug('MIDDLEWARE:START', { url: request.url })

    // Catch-all route rewrite paths should not be handled by middleware
    // NOTE: We don't handle this via config matchers, because nextjs configs need to be static
    const { config: routeRewriteConfig } = getRewriteForPath(
      request.nextUrl.pathname,
      'route'
    )

    if (routeRewriteConfig) {
      l.debug('MIDDLEWARE:ROUTE_REWRITE_SKIP', {
        pathname: request.nextUrl.pathname,
      })
      return NextResponse.next({
        request,
      })
    }

    // Check if the path should be rewritten by middleware
    const { config: middlewareRewriteConfig } = getRewriteForPath(
      request.nextUrl.pathname,
      'middleware'
    )

    if (middlewareRewriteConfig) {
      l.debug('MIDDLEWARE:REWRITE', {
        pathname: request.nextUrl.pathname,
        domain: middlewareRewriteConfig.domain,
      })
      const rewriteUrl = new URL(request.url)
      rewriteUrl.hostname = middlewareRewriteConfig.domain
      rewriteUrl.protocol = 'https'
      rewriteUrl.port = ''

      const headers = new Headers(request.headers)

      if (ALLOW_SEO_INDEXING) {
        headers.set('x-e2b-should-index', '1')
      }

      return NextResponse.rewrite(rewriteUrl, {
        request: {
          headers,
        },
      })
    }

    // Setup response and Supabase client
    const response = NextResponse.next({
      request,
    })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { error, data } = await getUserSession(supabase)
    l.debug('MIDDLEWARE:USER_SESSION', {
      error: !!error,
      hasUser: !!data?.user,
    })

    // Handle authentication redirects
    const authRedirect = getAuthRedirect(request, !error)
    if (authRedirect) {
      l.debug('MIDDLEWARE:AUTH_REDIRECT')
      return authRedirect
    }

    // Early return for non-dashboard routes or no user
    if (!data?.user || !isDashboardRoute(request.nextUrl.pathname)) {
      l.debug('MIDDLEWARE:SKIP', {
        hasDashboardRoute: isDashboardRoute(request.nextUrl.pathname),
        hasUser: !!data?.user,
      })
      return response
    }

    // Handle team resolution for all dashboard routes
    const teamResult = await resolveTeamForDashboard(request, data.user.id)
    l.debug('MIDDLEWARE:TEAM_RESOLUTION', { hasTeamResult: !!teamResult })

    // Process team resolution result
    return handleTeamResolution(request, response, teamResult)
  } catch (error) {
    l.error('MIDDLEWARE:UNEXPECTED_ERROR', error)
    // Return a basic response to avoid infinite loops
    return NextResponse.next({
      request,
    })
  }
}

export const config = {
  runtime: 'nodejs',
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * - api routes
     * - vercel analytics route
     * - sentry routes
     * - posthog routes
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|_vercel/|monitoring|ingest/).*)',
  ],
}
