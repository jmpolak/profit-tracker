import { Module } from '@nestjs/common';
import { WalletUseCase } from './wallet-use-case';
// import { AaveRestModule } from 'src/frameworks/clients/aave-rest-client/aave-rest.module';
import { DatabaseServiceModule } from 'src/frameworks/database-repository/database-repository.module';
// import { JupiterLendRestModule } from 'src/frameworks/clients/jupiter-lend-rest-client/jupiter-lend-rest.module';
import { LendingRestClientModule } from 'src/frameworks/clients/lending-sites/lending-rest-client.module';
import { WalletUpdateDailyInformationFacade } from './facade/wallet-update-info-facade';

@Module({
  imports: [DatabaseServiceModule, LendingRestClientModule],
  controllers: [],
  providers: [WalletUseCase, WalletUpdateDailyInformationFacade],

  exports: [WalletUseCase],
})
export class WalletModule {}
