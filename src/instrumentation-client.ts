import * as Sentry from '@sentry/nextjs'

export default async function register() {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
    tracesSampleRate: process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE
      ? parseFloat(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE)
      : 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: process.env.NEXT_PUBLIC_SENTRY_DEBUG === '1',

    // Disable source maps in development to prevent 404 errors
    attachStacktrace:
      process.env.NODE_ENV === 'production' &&
      !!process.env.NEXT_PUBLIC_SENTRY_DSN,
    enabled:
      process.env.NODE_ENV === 'production' &&
      !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  })
}

export const onRequestError = Sentry.captureRequestError
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
