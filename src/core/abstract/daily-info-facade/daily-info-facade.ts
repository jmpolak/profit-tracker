import { DailyPositionsInformation } from 'src/core/entity/daily-position-information';

export abstract class IDailyInfoFetcherFacade {
  abstract execute(
    wallet: string,
    returnTransactions: boolean,
    poolAddresses: string[],
  ): Promise<DailyPositionsInformation[]>;
}
