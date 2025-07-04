import winston from 'winston'
import { VERBOSE } from '@/configs/flags'

const level = VERBOSE ? 'debug' : process.env.LOG_LEVEL || 'info'

function createServerLogger() {
  return winston.createLogger({
    level,
    format: winston.format.combine(winston.format.timestamp()),
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      }),
    ],
  })
}

export const l = createServerLogger()
