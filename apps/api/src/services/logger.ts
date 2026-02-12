// apps/api/src/services/logger.ts
// Centralized logging service with configurable levels and file output

import { appendFileSync, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs';
import { join } from 'path';

// Log levels in order of severity
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
}

interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  writeToFile: boolean;
  maxFileSizeMB: number;
  maxFiles: number;
}

// Default configuration
let config: LoggerConfig = {
  enabled: process.env.NODE_ENV !== 'test',
  level: (process.env.LOG_LEVEL as LogLevel) || 'info',
  writeToFile: false,
  maxFileSizeMB: 10,
  maxFiles: 5,
};

// In-memory log buffer for recent logs (useful for debug export)
const LOG_BUFFER_SIZE = 1000;
const logBuffer: LogEntry[] = [];

// Log directory
const LOG_DIR = process.env.LOG_DIR || join(process.cwd(), 'logs');

/**
 * Update logger configuration
 */
export function configureLogger(newConfig: Partial<LoggerConfig>): void {
  config = { ...config, ...newConfig };

  // Ensure log directory exists if file writing is enabled
  if (config.writeToFile && !existsSync(LOG_DIR)) {
    mkdirSync(LOG_DIR, { recursive: true });
  }
}

/**
 * Get current logger configuration
 */
export function getLoggerConfig(): LoggerConfig {
  return { ...config };
}

/**
 * Check if a log level should be output based on current config
 */
function shouldLog(level: LogLevel): boolean {
  if (!config.enabled) return false;
  return LOG_LEVEL_PRIORITY[level] <= LOG_LEVEL_PRIORITY[config.level];
}

/**
 * Format a log entry for console output
 */
function formatConsole(entry: LogEntry): string {
  const levelColors: Record<LogLevel, string> = {
    error: '\x1b[31m', // red
    warn: '\x1b[33m',  // yellow
    info: '\x1b[36m',  // cyan
    debug: '\x1b[90m', // gray
  };
  const reset = '\x1b[0m';
  const color = levelColors[entry.level];

  let msg = `${color}[${entry.level.toUpperCase()}]${reset} [${entry.category}] ${entry.message}`;
  if (entry.data) {
    msg += ` ${JSON.stringify(entry.data)}`;
  }
  return msg;
}

/**
 * Format a log entry for file output
 */
function formatFile(entry: LogEntry): string {
  let msg = `${entry.timestamp} [${entry.level.toUpperCase()}] [${entry.category}] ${entry.message}`;
  if (entry.data) {
    msg += ` ${JSON.stringify(entry.data)}`;
  }
  return msg + '\n';
}

/**
 * Get current log file path
 */
function getLogFilePath(): string {
  const date = new Date().toISOString().split('T')[0];
  return join(LOG_DIR, `habitrack-${date}.log`);
}

/**
 * Write to log file with rotation
 */
function writeToFile(entry: LogEntry): void {
  if (!config.writeToFile) return;

  try {
    const filePath = getLogFilePath();

    // Check if we need to rotate
    if (existsSync(filePath)) {
      const stats = statSync(filePath);
      const sizeMB = stats.size / (1024 * 1024);

      if (sizeMB >= config.maxFileSizeMB) {
        // Rotate files
        rotateLogFiles();
      }
    }

    appendFileSync(filePath, formatFile(entry));
  } catch (err) {
    // Don't throw errors from logging - just console.error
    console.error('[Logger] Failed to write to file:', err);
  }
}

/**
 * Rotate log files (delete oldest if over max)
 */
function rotateLogFiles(): void {
  try {
    if (!existsSync(LOG_DIR)) return;

    const files = readdirSync(LOG_DIR)
      .filter(f => f.startsWith('habitrack-') && f.endsWith('.log'))
      .map(f => ({
        name: f,
        path: join(LOG_DIR, f),
        time: statSync(join(LOG_DIR, f)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time);

    // Delete oldest files if over max
    while (files.length >= config.maxFiles) {
      const oldest = files.pop();
      if (oldest) {
        unlinkSync(oldest.path);
      }
    }
  } catch (err) {
    console.error('[Logger] Failed to rotate files:', err);
  }
}

/**
 * Add entry to in-memory buffer
 */
function addToBuffer(entry: LogEntry): void {
  logBuffer.push(entry);

  // Trim buffer if too large
  while (logBuffer.length > LOG_BUFFER_SIZE) {
    logBuffer.shift();
  }
}

/**
 * Core logging function
 */
function log(level: LogLevel, category: string, message: string, data?: any): void {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    data,
  };

  // Add to buffer
  addToBuffer(entry);

  // Console output
  console.log(formatConsole(entry));

  // File output
  if (config.writeToFile) {
    writeToFile(entry);
  }
}

/**
 * Create a logger for a specific category
 */
export function createLogger(category: string) {
  return {
    error: (message: string, data?: any) => log('error', category, message, data),
    warn: (message: string, data?: any) => log('warn', category, message, data),
    info: (message: string, data?: any) => log('info', category, message, data),
    debug: (message: string, data?: any) => log('debug', category, message, data),
  };
}

/**
 * Get recent logs from buffer
 */
export function getRecentLogs(limit: number = 100, level?: LogLevel): LogEntry[] {
  let logs = [...logBuffer];

  if (level) {
    const priority = LOG_LEVEL_PRIORITY[level];
    logs = logs.filter(l => LOG_LEVEL_PRIORITY[l.level] <= priority);
  }

  return logs.slice(-limit);
}

/**
 * Get all logs as a string for export
 */
export function exportLogs(level?: LogLevel): string {
  const logs = getRecentLogs(LOG_BUFFER_SIZE, level);
  return logs.map(formatFile).join('');
}

/**
 * Clear log buffer
 */
export function clearLogBuffer(): void {
  logBuffer.length = 0;
}

/**
 * Get log file paths for download
 */
export function getLogFiles(): { name: string; path: string; size: number; modified: Date }[] {
  if (!existsSync(LOG_DIR)) return [];

  return readdirSync(LOG_DIR)
    .filter(f => f.startsWith('habitrack-') && f.endsWith('.log'))
    .map(f => {
      const path = join(LOG_DIR, f);
      const stats = statSync(path);
      return {
        name: f,
        path,
        size: stats.size,
        modified: stats.mtime,
      };
    })
    .sort((a, b) => b.modified.getTime() - a.modified.getTime());
}

// Default logger instance
export const logger = createLogger('app');
