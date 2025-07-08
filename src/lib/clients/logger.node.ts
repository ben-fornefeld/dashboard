/* eslint-disable @typescript-eslint/no-explicit-any */
import type { IncomingMessage, ServerResponse } from 'http'
import pino from 'pino'

// Extend IncomingMessage so we can capture a request id if middleware sets it
interface LoggableRequest extends IncomingMessage {
  id?: string
}

const isDev = process.env.NODE_ENV !== 'production'

/**
 * Base pino instance.
 * In development we pipe the output through pino-pretty for colourised logs.
 * In production the output is plain NDJSON so that Vercel Log Drains (or any
 * other collector) can consume it without further transformation.
 */
export const baseLogger = pino({
  timestamp: pino.stdTimeFunctions.isoTime,
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
})

/**
 * Convenience HTTP middleware (works both in API routes and App Router
 * handlers).
 */
export function withRequestLogging<T>(
  handler: (req: IncomingMessage, res: ServerResponse) => T
) {
  return (req: IncomingMessage, res: ServerResponse) => {
    const start = Date.now()
    const child = baseLogger.child({
      reqId: (req as LoggableRequest).id,
      url: req.url,
      method: req.method,
    })

    child.info('request.start')

    const finish = () => {
      res.removeListener('finish', finish)
      child.info(
        { statusCode: res.statusCode, duration: Date.now() - start },
        'request.complete'
      )
    }

    res.on('finish', finish)
    return handler(req, res)
  }
}

export const logger = baseLogger

// expose globally so that adhoc modules can do `logger.info()` without import
;(globalThis as { logger?: typeof baseLogger }).logger = baseLogger
