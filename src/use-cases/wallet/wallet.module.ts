import { Module } from '@nestjs/common';
import { WalletUseCase } from './wallet-use-case';
import { TransactionsFilterUtils } from 'src/utils/transactions-filter-utils';
import { MongodbModule } from 'src/frameworks/database/mongodb.module';
import { AaveRestModule } from 'src/frameworks/clients/aave-rest-client/aave-rest.module';

@Module({
  imports: [MongodbModule, AaveRestModule],
  controllers: [],
  providers: [WalletUseCase, TransactionsFilterUtils],

  exports: [WalletUseCase],
})
export class WalletModule {}
