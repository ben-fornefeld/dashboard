import { VERBOSE } from '@/configs/flags'

const isBrowser = typeof window !== 'undefined'
const level = VERBOSE ? 'debug' : process.env.LOG_LEVEL || 'info'

// ---------------------------------------------------------------------------
// Browser logger – thin wrapper around `console.*`
// ---------------------------------------------------------------------------

function createBrowserLogger() {
  // Utility to optionally silence debug level when VERBOSE is off
  const canDebug = level === 'debug'

  const style = {
    debug: 'color: DodgerBlue; font-weight:bold',
    info: 'color: gray; font-weight:bold',
    warn: 'color: orange; font-weight:bold',
    error: 'color: red; font-weight:bold',
    success: 'color: green; font-weight:bold',
  } as const

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    debug: (...args: any[]) =>
      canDebug && console.debug('%cDEBUG', style.debug, ...args),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    info: (...args: any[]) => console.info('%cINFO', style.info, ...args),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    warn: (...args: any[]) => console.warn('%cWARN', style.warn, ...args),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error: (...args: any[]) => console.error('%cERROR', style.error, ...args),
    // Custom success helper, maps to console.log / pino.info
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    success: (...args: any[]) =>
      console.log('%cSUCCESS', style.success, ...args),
  }
}

export const l = createBrowserLogger()
