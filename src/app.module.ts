import { MiddlewareConsumer, Module } from '@nestjs/common';
import { BasicController } from './interface/controllers/basic-controller';
import { WalletModule } from './application/use-cases/wallet/wallet.module';
import { FileModule } from './application/use-cases/file/file.module';
import { DailyUpdateWalletCronJobModule } from './frameworks/cronjobs/daily-update-wallet-entry/daily-update-wallet.module';
import { LoggerMiddleware } from './interface/middleware/http-request-logger';
import { LoggerModule } from './frameworks/logger/logger-module';
import { UnhandledHttpExceptionsFilter } from './interface/exception-filters/unhandled-http-exceptions-filter';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [
    WalletModule,
    FileModule,
    DailyUpdateWalletCronJobModule,
    LoggerModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [BasicController],
  providers: [UnhandledHttpExceptionsFilter],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*'); // Applies to all routes
  }
}
