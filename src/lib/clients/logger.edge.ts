// Simple logger that wraps console methods for Edge and Browser environments.
// We only implement the methods we actually use and cast the result to Winston's `Logger`
// interface so that the rest of the codebase can depend on the `logger` shape without
// pulling the full Winston implementation into an edge bundle.

import { VERBOSE } from '@/configs/flags'

const logger = {
  debug: (...args: unknown[]) => {
    if (!VERBOSE) return

    console.info(...args)
    return logger
  },
  info: (...args: unknown[]) => {
    console.info(...args)
    return logger
  },
  warn: (...args: unknown[]) => {
    console.warn(...args)
    return logger
  },
  error: (...args: unknown[]) => {
    console.error(...args)
    return logger
  },
}

export { logger }
