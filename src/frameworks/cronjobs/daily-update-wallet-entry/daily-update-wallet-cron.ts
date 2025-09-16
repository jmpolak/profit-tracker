import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { WalletUseCase } from 'src/application/use-cases/wallet/wallet-use-case';

@Injectable()
export class DailyUpdateWalletCronJob {
  private readonly logger = new Logger(DailyUpdateWalletCronJob.name);

  constructor(private walletUseCase: WalletUseCase) {}
  // Runs every day at 23:50 (11:50 PM)
  @Cron('59 23 * * *')
  async handleCron() {
    try {
      this.logger.log('Called every day at 23:59');
      await this.walletUseCase.updateWallets();
      this.logger.log('Cron job ended');
    } catch (err) {
      this.logger.error(err?.message ?? 'Cron job crashed');
    }
    // Your cron job logic here
  }
}
