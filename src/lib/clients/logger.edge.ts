import { context, trace } from '@opentelemetry/api'
// Small JSON logger for the Edge runtime (no stdout streams available)
// Vercel captures console.log/console.error and forwards the string to Log Drains.

function write(level: string, args: unknown[]) {
  const span = trace.getSpan(context.active())

  const payload = JSON.stringify({
    ts: Date.now(),
    level,
    message: typeof args[0] === 'string' ? args[0] : undefined,
    data: args.length > 1 ? args.slice(1) : undefined,
    traceId: span?.spanContext().traceId,
    spanId: span?.spanContext().spanId,
  })

  if (level === 'error') {
    console.error(payload)
  } else {
    console.log(payload)
  }
}

export const logger = {
  debug: (...a: unknown[]) => write('debug', a),
  info: (...a: unknown[]) => write('info', a),
  warn: (...a: unknown[]) => write('warn', a),
  error: (...a: unknown[]) => write('error', a),
} as const
