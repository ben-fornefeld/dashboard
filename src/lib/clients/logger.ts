import { VERBOSE } from '@/configs/flags'

const isBrowser =
  typeof window !== 'undefined' && typeof window.document !== 'undefined'

type ColorConfig = {
  fg: string
  bg: string
}

type LevelConfig = {
  browser: string // CSS style string
  terminal: ColorConfig // ANSI color codes
}

const LEVEL_STYLES: Record<string, LevelConfig> = {
  DEBUG: {
    browser:
      'background: #9e9e9e; color: #000; padding: 1px 3px; border-radius: 2px',
    terminal: { fg: '\x1b[30m', bg: '\x1b[100m' }, // Black on gray
  },
  INFO: {
    browser:
      'background: #00bcd4; color: #000; padding: 1px 3px; border-radius: 2px',
    terminal: { fg: '\x1b[30m', bg: '\x1b[46m' }, // Black on cyan
  },
  WARN: {
    browser:
      'background: #ffc107; color: #000; padding: 1px 3px; border-radius: 2px',
    terminal: { fg: '\x1b[30m', bg: '\x1b[43m' }, // Black on yellow
  },
  ERROR: {
    browser:
      'background: #f44336; color: #fff; padding: 1px 3px; border-radius: 2px',
    terminal: { fg: '\x1b[37m', bg: '\x1b[41m' }, // White on red
  },
}

const DEFAULT_TERMINAL_COLORS: ColorConfig = {
  fg: '\x1b[30m', // Black
  bg: '\x1b[47m', // White background
}

const ANSI_RESET = '\x1b[0m'

function formatContext(context: unknown): unknown {
  if (context === undefined || context === null) return ''

  return context
}

const supportsAnsi =
  !isBrowser &&
  typeof process !== 'undefined' &&
  !!process.stdout &&
  !!process.stdout.isTTY &&
  !(
    'NO_COLOR' in process.env ||
    'NODE_DISABLE_COLORS' in process.env ||
    process.env.FORCE_COLOR === '0'
  )

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
      const style = LEVEL_STYLES[levelLabel]?.browser ?? ''
      parts = [`%c ${levelLabel} `, style, key]
    } else if (supportsAnsi) {
      const colors =
        LEVEL_STYLES[levelLabel]?.terminal ?? DEFAULT_TERMINAL_COLORS
      parts = [
        `${colors.bg}${colors.fg} ${levelLabel} ${ANSI_RESET}`,
        `${key}${ANSI_RESET}`,
      ]
    } else {
      parts = [`${levelLabel} | `, key]
    }

    if (message) parts.push(message)
    if (context !== undefined) {
      parts.push('\n', formatContext(context))
    }

    fn(...parts)
  }
}

export const l = new Logger()
