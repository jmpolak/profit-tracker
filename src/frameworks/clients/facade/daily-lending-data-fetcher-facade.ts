import { Inject, Injectable } from '@nestjs/common';
import { LENDING_REST_CLIENTS } from '../lending-sites/lending-rest-client.module';
import { ILendingRestClient } from 'src/frameworks/clients/lending-sites/lending-rest-client';
import { StrategyFactory } from './factory/stategy-factory';
import { DailyPositionsInformation } from 'src/core/entity/daily-position-information';
import { IDailyInfoFetcherFacade } from 'src/core/abstract/daily-info-facade/daily-info-facade';

@Injectable()
export class DailyLendingDataFetcherFacade implements IDailyInfoFetcherFacade {
  @Inject(LENDING_REST_CLIENTS)
  private lendingRestClient: ILendingRestClient[];
  constructor(private strategyFactory: StrategyFactory) {}

  async execute(wallet: string): Promise<DailyPositionsInformation[]> {
    return await Promise.all(
      this.lendingRestClient
        .map((lrc) => this.strategyFactory.create(lrc.SITE_NAME))
        .filter((s) => s.isExecutable(wallet))
        .map((s) => s.getDailyPositionInformation(wallet)),
    );
  }
}
