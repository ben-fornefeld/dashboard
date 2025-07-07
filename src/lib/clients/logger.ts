import { VERBOSE } from '@/configs/flags'

const isBrowser =
  typeof window !== 'undefined' && typeof window.document !== 'undefined'

const BROWSER_LEVEL_STYLES: Record<string, string> = {
  DEBUG:
    'background: #9e9e9e; color: #000; padding: 1px 3px; border-radius: 2px',
  INFO: 'background: #00bcd4; color: #000; padding: 1px 3px; border-radius: 2px',
  WARN: 'background: #ffc107; color: #000; padding: 1px 3px; border-radius: 2px',
  ERROR:
    'background: #f44336; color: #fff; padding: 1px 3px; border-radius: 2px',
}

function formatContext(context: unknown): unknown {
  if (context === undefined || context === null) return ''

  return context
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

  warn(key: string, context: unknown): void
  warn(key: string, message: string, context: unknown): void
  warn(
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

    let parts: unknown[]

    if (isBrowser) {
      // Use %c to colour only the level label in browsers. Escape codes are ignored by browsers
      const style = BROWSER_LEVEL_STYLES[levelLabel] ?? ''
      parts = [`%c ${levelLabel} `, style, key]
    } else {
      // ANSI colours for Node / TTY targets
      const levelColors = {
        DEBUG: { fg: '\x1b[30m', bg: '\x1b[100m' }, // Black on gray
        INFO: { fg: '\x1b[30m', bg: '\x1b[46m' }, // Black on cyan
        WARN: { fg: '\x1b[30m', bg: '\x1b[43m' }, // Black on yellow
        ERROR: { fg: '\x1b[37m', bg: '\x1b[41m' }, // White on red
      } as const

      const colors = levelColors[levelLabel as keyof typeof levelColors] || {
        fg: '\x1b[30m', // Black
        bg: '\x1b[47m', // White background
      }
      const reset = '\x1b[0m'
      parts = [
        `${colors.bg}${colors.fg} ${levelLabel} ${reset}`,
        `${colors.fg}${key}${reset}`,
      ]
    }

    if (message) parts.push(message)
    if (context !== undefined) {
      parts.push('\n', formatContext(context))
    }

    fn(...parts)
  }
}

export const l = new Logger()
