import { Inject, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { WalletUseCase } from 'src/application/use-cases/wallet/wallet-use-case';
import { LoggerPort } from 'src/core/abstract/logger-port/logger-port';
import { ImmutableDate } from 'src/core/entity/immutable-date';

@Injectable()
export class DailyUpdateWalletCronJob {
  constructor(
    private walletUseCase: WalletUseCase,
    private logger: LoggerPort,
  ) {}
  // Runs every day at 23:59 (11:59 PM)
  @Cron('59 23 * * *')
  async handleCron() {
    try {
      const date = new Date() as ImmutableDate;
      this.logger.log(`Cron jobs started at ${date.toLocaleTimeString()}`);
      await this.walletUseCase.updateWallets(date);
      this.logger.log(`Cron job ended at ${new Date().toLocaleTimeString()}`);
    } catch (err) {
      this.logger.error(err?.message ?? 'Cron job crashed');
    }
  }
}
