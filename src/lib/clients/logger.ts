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
  /**
   * Log messages at a specific level
   * @param level - Log level (DEBUG, INFO, WARN, ERROR)
   * @param key - Identifier for the log entry
   * @param messageOrContext - Message string or context object
   * @param maybeContext - Optional context object when message is provided
   */
  log(level: string, key: string, context: unknown): void
  log(level: string, key: string, message: string, context: unknown): void
  log(
    level: string,
    key: string,
    messageOrContext: string | unknown,
    maybeContext?: unknown
  ): void {
    this.#log(console.log, level, key, messageOrContext, maybeContext)
  }

  /**
   * Log debug level messages (only shown when VERBOSE flag is enabled)
   * @param key - Identifier for the log entry
   * @param messageOrContext - Message string or context object
   * @param maybeContext - Optional context object when message is provided
   * @example
   * logger.debug('INIT', 'Starting initialization', { config: { port: 3000 } })
   * logger.debug('QUERY', { sql: 'SELECT * FROM users' })
   */
  debug(key: string, context: unknown): void
  debug(key: string, message: string, context: unknown): void
  debug(
    key: string,
    messageOrContext: string | unknown,
    maybeContext?: unknown
  ): void {
    if (!VERBOSE) return

    this.#log(console.debug, 'DEBUG', key, messageOrContext, maybeContext)
  }

  /**
   * Log info level messages
   * @param key - Identifier for the log entry
   * @param messageOrContext - Message string or context object
   * @param maybeContext - Optional context object when message is provided
   * @example
   * logger.info('SERVER', 'Server started', { port: 3000 })
   * logger.info('CACHE_HIT', { key: 'user:123' })
   */
  info(key: string, context: unknown): void
  info(key: string, message: string, context: unknown): void
  info(
    key: string,
    messageOrContext: string | unknown,
    maybeContext?: unknown
  ): void {
    if (!VERBOSE) return

    this.#log(console.info, 'INFO', key, messageOrContext, maybeContext)
  }

  /**
   * Log warning level messages
   * @param key - Identifier for the log entry
   * @param messageOrContext - Message string or context object
   * @param maybeContext - Optional context object when message is provided
   * @example
   * logger.warn('DEPRECATED', 'This method will be removed', { method: 'oldFn' })
   * logger.warn('HIGH_MEMORY', { usagePercent: 85 })
   */
  warn(key: string, context: unknown): void
  warn(key: string, message: string, context: unknown): void
  warn(
    key: string,
    messageOrContext: string | unknown,
    maybeContext?: unknown
  ): void {
    this.#log(console.warn, 'WARN', key, messageOrContext, maybeContext)
  }

  /**
   * Log error level messages
   * @param key - Identifier for the log entry
   * @param messageOrContext - Message string or context object
   * @param maybeContext - Optional context object when message is provided
   * @example
   * logger.error('DB_CONN', 'Failed to connect', { error: 'timeout' })
   * logger.error('AUTH_FAILED', { userId: '123', reason: 'invalid_token' })
   */
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

    // check environment and format accordingly
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
      parts.push('\n', context)
    }

    fn(...parts)
  }
}

export const l = new Logger()
