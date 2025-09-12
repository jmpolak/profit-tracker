import { Module } from '@nestjs/common';
import { BasicController } from './controllers/basic-controller';
import { WalletModule } from './use-cases/wallet/wallet.module';
import { FileModule } from './use-cases/file/file.module';
import { DailyUpdateWalletCronJobModule } from './frameworks/cronjobs/daily-update-wallet-entry/daily-update-wallet.module';

@Module({
  imports: [WalletModule, FileModule, DailyUpdateWalletCronJobModule],
  controllers: [BasicController],
  providers: [],
})
export class AppModule {}
