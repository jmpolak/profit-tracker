import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { WalletModule } from 'src/use-cases/wallet/wallet.module';
import { DailyUpdateWalletCronJob } from './daily-update-wallet-cron';

@Module({
  imports: [WalletModule, ScheduleModule.forRoot()],
  providers: [DailyUpdateWalletCronJob],
})
export class DailyUpdateWalletCronJobModule {}
