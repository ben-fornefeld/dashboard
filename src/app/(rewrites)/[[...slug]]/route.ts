import sitemap from '@/app/sitemap'
import { ALLOW_SEO_INDEXING } from '@/configs/flags'
import { ROUTE_REWRITE_CONFIG } from '@/configs/rewrites'
import { BASE_URL } from '@/configs/urls'
import { l } from '@/lib/clients/logger'
import {
  getRewriteForPath,
  rewriteContentPagesHtml,
} from '@/lib/utils/rewrites'
import { NextRequest } from 'next/server'

export const revalidate = 900
export const dynamic = 'force-static'

const REVALIDATE_TIME = 900 // 15 minutes ttl

export async function GET(request: NextRequest): Promise<Response> {
  const url = new URL(request.url)
  l.debug('CATCHALL:START', { url: url.toString() })

  const requestHostname = url.hostname
  l.debug('CATCHALL:REQUEST_HOSTNAME', { hostname: requestHostname })

  const updateUrlHostname = (newHostname: string) => {
    url.hostname = newHostname
    url.port = ''
    url.protocol = 'https'
    l.debug('CATCHALL:UPDATE_URL_HOSTNAME', {
      newHostname,
      updatedUrl: url.toString(),
    })
  }

  const { config, rule } = getRewriteForPath(url.pathname, 'route')
  l.debug('CATCHALL:REWRITE_CONFIG', { hasConfig: !!config, hasRule: !!rule })

  if (config) {
    if (rule && rule.pathPreprocessor) {
      const originalPath = url.pathname
      url.pathname = rule.pathPreprocessor(url.pathname)
      l.debug('CATCHALL:PATH_PREPROCESSOR', {
        originalPath,
        newPath: url.pathname,
      })
    }
    updateUrlHostname(config.domain)
  }

  try {
    const notFound = url.hostname === requestHostname
    l.debug('CATCHALL:NOT_FOUND_CHECK', { notFound })

    // if hostname did not change, we want to make sure it does not cache the route based on the build times hostname (127.0.0.1:3000)
    const fetchUrl = notFound ? `${BASE_URL}/not-found` : url.toString()
    l.debug('CATCHALL:FETCH_URL', { fetchUrl })

    const res = await fetch(fetchUrl, {
      headers: new Headers(request.headers),
      redirect: 'follow',
      // if the hostname is the same, we don't want to cache the response, since it will not be available in build time
      ...(notFound
        ? { cache: 'no-store' }
        : {
            next: {
              revalidate: REVALIDATE_TIME,
            },
          }),
    })
    l.debug('CATCHALL:FETCH_RESPONSE', { status: res.status })

    const contentType = res.headers.get('Content-Type')
    const newHeaders = new Headers(res.headers)
    l.debug('CATCHALL:CONTENT_TYPE', { contentType })

    if (contentType?.startsWith('text/html')) {
      let html = await res.text()
      l.debug('CATCHALL:HTML_RESPONSE', { htmlLength: html.length })

      // remove content-encoding header to ensure proper rendering
      newHeaders.delete('content-encoding')

      // rewrite absolute URLs pointing to the rewritten domain to relative paths and with correct SEO tags
      if (config) {
        const rewrittenPrefix = `https://${config.domain}`
        l.debug('CATCHALL:REWRITE_HTML', { rewrittenPrefix })

        html = rewriteContentPagesHtml(html, {
          seo: {
            pathname: url.pathname,
            allowIndexing: ALLOW_SEO_INDEXING,
          },
          hrefPrefixes: [rewrittenPrefix, 'https://e2b.dev'],
        })
      }

      // create a new response with the modified HTML
      const modifiedResponse = new Response(html, {
        status: notFound ? 404 : res.status,
        headers: newHeaders,
      })
      l.debug('CATCHALL:MODIFIED_RESPONSE', { status: modifiedResponse.status })

      return modifiedResponse
    }

    l.debug('CATCHALL:NON_HTML_RESPONSE')
    return res
  } catch (error) {
    l.error('CATCHALL:UNEXPECTED_ERROR', error)

    return new Response(
      `Proxy Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      {
        status: 502,
        headers: { 'Content-Type': 'text/plain' },
      }
    )
  }
}

export async function generateStaticParams() {
  l.debug('CATCHALL:GENERATE_STATIC_PARAMS:START')
  const sitemapEntries = await sitemap()
  l.debug('CATCHALL:GENERATE_STATIC_PARAMS:SITEMAP', {
    entriesCount: sitemapEntries.length,
  })

  const slugs = sitemapEntries
    .filter((entry) => {
      const url = new URL(entry.url)
      const pathname = url.pathname

      // Check if this path matches any rule in ROUTE_REWRITE_CONFIG
      for (const domainConfig of ROUTE_REWRITE_CONFIG) {
        const isIndex = pathname === '/' || pathname === ''
        const matchingRule = domainConfig.rules.find((rule) => {
          if (isIndex && rule.path === '/') {
            return true
          }
          if (pathname === rule.path || pathname.startsWith(rule.path + '/')) {
            return true
          }
          return false
        })

        if (matchingRule) {
          l.debug('CATCHALL:GENERATE_STATIC_PARAMS:MATCH_FOUND', {
            pathname,
            domain: domainConfig.domain,
          })
          return true
        }
      }
      return false
    })
    .map((entry) => {
      // Map the filtered entries to slug format
      const url = new URL(entry.url)
      const pathname = url.pathname
      const pathSegments = pathname
        .split('/')
        .filter((segment) => segment !== '')
      return { slug: pathSegments.length > 0 ? pathSegments : undefined }
    })

  l.debug('CATCHALL:GENERATE_STATIC_PARAMS:COMPLETE', {
    slugCount: slugs.length,
  })
  return slugs
}
