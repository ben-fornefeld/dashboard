import * as Sentry from '@sentry/nextjs'
import { registerOTel } from '@vercel/otel'

export async function register() {
  console.log(
    'Registering OpenTelemetry with service:',
    process.env.OTEL_SERVICE_NAME || 'e2b-dashboard'
  )
  registerOTel({
    serviceName: process.env.OTEL_SERVICE_NAME || 'e2b-dashboard',
    instrumentationConfig: {
      fetch: {
        propagateContextUrls: [],
      },
    },
  })

  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.CI !== '1') {
    console.log('Loading Node.js specific configurations:', {
      runtime: process.env.NEXT_RUNTIME,
      ci: process.env.CI,
      imports: ['sentry.server.config', 'winston', 'next-logger'],
    })
    await import('../sentry.server.config')
    await import('winston')
    // @ts-expect-error no types
    await import('next-logger')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    console.log('Loading Edge runtime configurations:', {
      runtime: process.env.NEXT_RUNTIME,
      imports: ['sentry.edge.config'],
    })
    await import('../sentry.edge.config')
  }
}

export const onRequestError = Sentry.captureRequestError
