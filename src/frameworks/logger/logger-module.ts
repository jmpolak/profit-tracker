import { Global, Module } from '@nestjs/common';
import { LoggerPort } from 'src/core/abstract/logger-port/logger-port';
import { CustomLoggerService } from './logger';
@Global()
@Module({
  providers: [
    {
      provide: LoggerPort,
      useClass: CustomLoggerService,
    },
  ],
  exports: [LoggerPort],
})
export class LoggerModule {}
