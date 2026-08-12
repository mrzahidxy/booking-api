// src/utils/logger.ts
import fs from 'fs';
import path from 'path';
import { createLogger, format, transports } from 'winston';
const { combine, timestamp, printf, colorize, errors } = format;

// Custom format
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack ?? message}`;
});

// Setup transports array
const loggerTransports: any[] = [];

// Always add Console transport
loggerTransports.push(
  new transports.Console({
    format: combine(colorize(), logFormat),
  })
);

const logDir = path.resolve('logs');

// Make sure 'logs/' exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

loggerTransports.push(
  new transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
  new transports.File({ filename: path.join(logDir, 'combined.log') })
);

// Create logger
const logger = createLogger({
  level: 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
  transports: loggerTransports,
});

export default logger;
