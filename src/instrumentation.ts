import * as Sentry from '@sentry/nextjs'
import { registerOTel } from '@vercel/otel'

export async function register() {
  // Start OpenTelemetry for both runtimes. If you need custom exporter
  // pass an object instead of the string below.
  registerOTel({ serviceName: 'dashboard' })

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config')
    await import('./lib/clients/logger.node')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config')
    await import('./lib/clients/logger.edge')
  }
}

export const onRequestError = Sentry.captureRequestError
