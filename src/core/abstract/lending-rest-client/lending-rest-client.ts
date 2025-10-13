import { DailyPositionsInformation } from 'src/core/entity/daily-position-information';

export abstract class ILendingRestClient {
  readonly SITE_NAME: string;
  abstract getDailyPositionInformation(
    wallet: string,
  ): Promise<DailyPositionsInformation>;

  abstract isExecutable(walletAddress: string);

  abstract getMarkets(); // remove it
}
