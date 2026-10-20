import { storage } from "../storage";

function formatLogArgument(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Error) return `${value.name}: ${value.message}${value.stack ? `\n${value.stack}` : ""}`;
  try {
    const json = JSON.stringify(value);
    return json === undefined ? String(value) : json;
  } catch {
    try { return String(value); } catch { return "[unserializable log value]"; }
  }
}

export class SystemLogger {
  private static instance: SystemLogger;
  private originalConsole: any = {};

  static getInstance(): SystemLogger {
    if (!SystemLogger.instance) {
      SystemLogger.instance = new SystemLogger();
    }
    return SystemLogger.instance;
  }

  init() {
    // Store original console methods
    this.originalConsole.log = console.log;
    this.originalConsole.warn = console.warn;
    this.originalConsole.error = console.error;
    this.originalConsole.info = console.info;

    // Override console methods to capture logs
    console.log = (...args) => {
      this.saveLog('info', args.join(' '));
      this.originalConsole.log(...args);
    };

    console.warn = (...args) => {
      this.saveLog('warn', args.join(' '));
      this.originalConsole.warn(...args);
    };

    console.error = (...args) => {
      const message = args.map(formatLogArgument).join(" ");
      this.saveLog('error', message);
      this.originalConsole.error(message);
    };

    console.info = (...args) => {
      this.saveLog('info', args.join(' '));
      this.originalConsole.info(...args);
    };

    // Clean up old logs every 10 minutes
    setInterval(() => {
      this.cleanupOldLogs();
    }, 10 * 60 * 1000); // 10 minutes
  }

  private async saveLog(level: string, message: string, source?: string, data?: any) {
    try {
      await storage.createSystemLog({
        level,
        message,
        source,
        data
      });
    } catch (error) {
      // Use original console to avoid infinite loop
      this.originalConsole.error('Failed to save system log:', error);
    }
  }

  async logAPIRequest(method: string, url: string, statusCode: number, responseTime?: number) {
    const message = `${method} ${url} ${statusCode}${responseTime ? ` in ${responseTime}ms` : ''}`;
    await this.saveLog('api', message, 'express', {
      method,
      url,
      statusCode,
      responseTime
    });
  }

  private async cleanupOldLogs() {
    try {
      await storage.deleteOldSystemLogs(30); // Keep only last 30 minutes
    } catch (error) {
      this.originalConsole.error('Failed to cleanup old logs:', error);
    }
  }
}

export const systemLogger = SystemLogger.getInstance();