// unified logger that preserves the previous class API (overloads)
// while delegating the actual write to a runtime-specific implementation
/* eslint-disable */

// ---------------------------------------------------------------------------
// Minimal interface every runtime variant must expose
// ---------------------------------------------------------------------------
export type RuntimeLogger = {
  debug: (...args: unknown[]) => void
  info: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
}
// ---------------------------------------------------------------------------
// Pick implementation at runtime (Node, Edge, Browser)
// ---------------------------------------------------------------------------
const runtimeImpl: RuntimeLogger = (() => {
  if (typeof window !== 'undefined') {
    return require('./logger.browser').logger as RuntimeLogger
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    return require('./logger.edge').logger as RuntimeLogger
  }
  return require('./logger.node').logger as RuntimeLogger
})()

// ---------------------------------------------------------------------------
// Public Logger class – API identical to the former implementation
// ---------------------------------------------------------------------------
export class Logger {
  constructor(private readonly impl: RuntimeLogger) {}

  // -----------------------------------------------------------------------
  // log (generic) ----------------------------------------------------------
  // -----------------------------------------------------------------------
  log(level: string, key: string, context: unknown): void
  log(level: string, key: string, message: string, context: unknown): void
  log(
    level: string,
    key: string,
    messageOrContext: string | unknown,
    maybeContext?: unknown
  ) {
    this.#emit(level.toLowerCase(), key, messageOrContext, maybeContext)
  }

  // -----------------------------------------------------------------------
  // debug ------------------------------------------------------------------
  // -----------------------------------------------------------------------
  debug(key: string, context: unknown): void
  debug(key: string, message: string, context: unknown): void
  debug(
    key: string,
    messageOrContext: string | unknown,
    maybeContext?: unknown
  ) {
    this.#emit('debug', key, messageOrContext, maybeContext)
  }

  // -----------------------------------------------------------------------
  // info -------------------------------------------------------------------
  // -----------------------------------------------------------------------
  info(key: string, context: unknown): void
  info(key: string, message: string, context: unknown): void
  info(
    key: string,
    messageOrContext: string | unknown,
    maybeContext?: unknown
  ) {
    this.#emit('info', key, messageOrContext, maybeContext)
  }

  // -----------------------------------------------------------------------
  // warn -------------------------------------------------------------------
  // -----------------------------------------------------------------------
  warn(key: string, context: unknown): void
  warn(key: string, message: string, context: unknown): void
  warn(
    key: string,
    messageOrContext: string | unknown,
    maybeContext?: unknown
  ) {
    this.#emit('warn', key, messageOrContext, maybeContext)
  }

  // -----------------------------------------------------------------------
  // error ------------------------------------------------------------------
  // -----------------------------------------------------------------------
  error(key: string, context: unknown): void
  error(key: string, message: string, context: unknown): void
  error(
    key: string,
    messageOrContext: string | unknown,
    maybeContext?: unknown
  ) {
    this.#emit('error', key, messageOrContext, maybeContext)
  }

  // -----------------------------------------------------------------------
  // private helpers --------------------------------------------------------
  // -----------------------------------------------------------------------
  #emit(
    level: keyof RuntimeLogger | string,
    key: string,
    messageOrContext: string | unknown,
    maybeContext?: unknown
  ) {
    const msg =
      typeof messageOrContext === 'string' ? messageOrContext : undefined
    const ctx =
      typeof messageOrContext === 'string' ? maybeContext : messageOrContext

    const payload = { key, ...(ctx !== undefined ? { ctx } : {}) }

    const implMap = this.impl as Record<string, (...a: unknown[]) => void>
    const method = (implMap[level] ?? this.impl.info).bind(this.impl)
    if (msg !== undefined) {
      method(payload, msg)
    } else {
      method(payload)
    }
  }
}

// Re-export singleton used across the code-base.
export const l = new Logger(runtimeImpl)
export const logger = l
