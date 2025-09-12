import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { WalletUseCase } from 'src/use-cases/wallet/wallet-use-case';

@Injectable()
export class DailyUpdateWalletCronJob {
  private readonly logger = new Logger(DailyUpdateWalletCronJob.name);

  constructor(private walletUseCase: WalletUseCase) {}
  // Runs every day at 23:50 (11:50 PM)
  @Cron('22 15 * * *')
  async handleCron() {
    this.logger.debug('Called every day at 23:50');
    try {
      await this.walletUseCase.updateWallets();
    } catch (err) {
      this.logger.debug(err);
    }
    this.logger.debug('Cron job ended');
    // Your cron job logic here
  }
}
