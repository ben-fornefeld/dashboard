import pino from 'pino'

// The main `pino` package ships a browser build that the bundler will pick
// automatically. In the browser we pretty-print to the console and rely on
// Log Drains that capture client logs (e.g. pino-logflare) only when you
// need them. For now we just provide a simple console serializer.

export const logger = pino({
  browser: {
    asObject: true,
    transmit: undefined, // user can enable pino-logflare or any custom transport
  },
  level: process.env.NEXT_PUBLIC_LOG_LEVEL || 'info',
})
