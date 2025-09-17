import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { LoggerPort } from 'src/core/abstract/logger-port/logger-port';

@Injectable()
export class CustomLoggerService implements LoggerPort {
  private readonly logDir = path.resolve('logs');
  private readonly combinedLogPath = path.join(this.logDir, 'combined.log');
  private readonly errorLogPath = path.join(this.logDir, 'error.log');

  constructor() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private writeToFile(filePath: string, message: string) {
    fs.appendFile(filePath, message + '\n', (err) => {
      if (err) {
        console.error('Failed to write log:', err);
      }
    });
  }

  private mkDirIfNotExists() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private format(
    level: string,
    message: string,
    context?: string,
    trace?: string,
  ): string {
    const timestamp = new Date().toISOString();
    let log = `[${timestamp}] [${level}]${context ? ` [${context}]` : ''}: ${message}`;
    if (trace) log += `\nTrace: ${trace}`;
    return log;
  }

  log(message: string, context?: string): void {
    this.mkDirIfNotExists();
    const formatted = this.format('LOG', message, context);
    console.log(formatted);
    this.writeToFile(this.combinedLogPath, formatted);
  }

  warn(message: string, context?: string): void {
    this.mkDirIfNotExists();
    const formatted = this.format('WARN', message, context);
    console.warn(formatted);
    this.writeToFile(this.combinedLogPath, formatted);
  }

  error(message: string, trace?: string, context?: string): void {
    this.mkDirIfNotExists();
    const formatted = this.format('ERROR', message, context, trace);
    console.error(formatted);
    this.writeToFile(this.errorLogPath, formatted);
    this.writeToFile(this.combinedLogPath, formatted);
  }
}
