import { MiddlewareConsumer, Module } from '@nestjs/common';
import { BasicController } from './interface/controllers/basic-controller';
import { WalletModule } from './application/use-cases/wallet/wallet.module';
import { FileModule } from './application/use-cases/file/file.module';
import { DailyUpdateWalletCronJobModule } from './frameworks/cronjobs/daily-update-wallet-entry/daily-update-wallet.module';
import { LoggerMiddleware } from './interface/middleware/http-request-logger';

@Module({
  imports: [WalletModule, FileModule, DailyUpdateWalletCronJobModule],
  controllers: [BasicController],
  providers: [],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*'); // Applies to all routes
  }
}
