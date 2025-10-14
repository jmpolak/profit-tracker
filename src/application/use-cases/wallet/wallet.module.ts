import { Module } from '@nestjs/common';
import { WalletUseCase } from './wallet-use-case';
import { DatabaseServiceModule } from 'src/frameworks/database-repository/database-repository.module';
import { WalletUpdateDailyInformationFacade } from './facade/wallet-update-info-facade';
import { DailyLendingDataFetcherModule } from 'src/frameworks/clients/facade/daily-lendnig-data-fetcher-module';

@Module({
  imports: [DatabaseServiceModule, DailyLendingDataFetcherModule],
  controllers: [],
  providers: [WalletUseCase, WalletUpdateDailyInformationFacade],

  exports: [WalletUseCase],
})
export class WalletModule {}
