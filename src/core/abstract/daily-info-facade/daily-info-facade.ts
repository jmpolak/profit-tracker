import { DailyPositionsInformation } from 'src/core/entity/daily-position-information';
import { ImmutableDate } from 'src/core/entity/immutable-date';

export abstract class IDailyInfoFetcherFacade {
  abstract execute(
    wallet: string,
    returnTransactions: boolean,
    poolAddresses: string[],
    date: ImmutableDate,
  ): Promise<DailyPositionsInformation[]>;
}
