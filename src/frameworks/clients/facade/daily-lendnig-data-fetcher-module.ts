import { Module } from '@nestjs/common';
import { LendingRestClientModule } from '../lending-sites/lending-rest-client.module';
import {
  AaveGetDailyInformationStrategy,
  JupiterGetDailyInformationStrategy,
} from './strategy/get-data-strategy';
import { StrategyFactory } from './factory/stategy-factory';
import { DailyLendingDataFetcherFacade } from './daily-lending-data-fetcher-facade';
import { IDailyInfoFetcherFacade } from 'src/core/abstract/daily-info-facade/daily-info-facade';
import { SolanaRpcModule } from '../rpc/solana/solana-rpc.module';
import { CoingeckoPriceApiModule } from '../external-api/coingecko-price-api/coingecko-price-api.module';

@Module({
  imports: [LendingRestClientModule, SolanaRpcModule, CoingeckoPriceApiModule],
  providers: [
    AaveGetDailyInformationStrategy,
    JupiterGetDailyInformationStrategy,
    StrategyFactory,
    {
      useClass: DailyLendingDataFetcherFacade,
      provide: IDailyInfoFetcherFacade,
    },
  ],
  exports: [IDailyInfoFetcherFacade],
})
export class DailyLendingDataFetcherModule {}
