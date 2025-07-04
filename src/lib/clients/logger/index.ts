import { VERBOSE } from '@/configs/flags'

// Context can be anything serialisable. We stringify objects prettily for readability.
function formatContext(context: unknown): string {
  if (context === undefined || context === null) return ''

  // Pretty-print objects/arrays for easier inspection.
  if (typeof context === 'object') {
    try {
      return JSON.stringify(context, null, 2)
    } catch {
      return String(context)
    }
  }
  return String(context)
}

export class Logger {
  /*
   *  Overloaded method signatures ‑ available on all levels
   *  ------------------------------------------------------
   *  1. level(key, context)
   *  2. level(key, message, context)
   */
  debug(key: string, context: unknown): void
  debug(key: string, message: string, context: unknown): void
  debug(
    key: string,
    messageOrContext: string | unknown,
    maybeContext?: unknown
  ): void {
    if (!VERBOSE) return // debug disabled unless VERBOSE flag enabled
    this.#log(console.debug, 'DEBUG', key, messageOrContext, maybeContext)
  }

  info(key: string, context: unknown): void
  info(key: string, message: string, context: unknown): void
  info(
    key: string,
    messageOrContext: string | unknown,
    maybeContext?: unknown
  ): void {
    this.#log(console.info, 'INFO', key, messageOrContext, maybeContext)
  }

  warning(key: string, context: unknown): void
  warning(key: string, message: string, context: unknown): void
  warning(
    key: string,
    messageOrContext: string | unknown,
    maybeContext?: unknown
  ): void {
    this.#log(console.warn, 'WARN', key, messageOrContext, maybeContext)
  }

  error(key: string, context: unknown): void
  error(key: string, message: string, context: unknown): void
  error(
    key: string,
    messageOrContext: string | unknown,
    maybeContext?: unknown
  ): void {
    this.#log(console.error, 'ERROR', key, messageOrContext, maybeContext)
  }

  // Internal helper to unify formatting across levels.
  // eslint-disable-next-line class-methods-use-this
  #log(
    fn: (...args: unknown[]) => void,
    levelLabel: string,
    key: string,
    messageOrContext: string | unknown,
    maybeContext?: unknown
  ): void {
    let message: string | undefined
    let context: unknown

    if (typeof messageOrContext === 'string') {
      message = messageOrContext
      context = maybeContext
    } else {
      context = messageOrContext
    }

    const parts: string[] = [`[${levelLabel}]`, key]

    if (message) parts.push('-', message)
    if (context !== undefined) parts.push('-', formatContext(context))

    fn(parts.join(' '))
  }
}

// Export a default singleton instance so existing code can just import { l }
export const l = new Logger()
