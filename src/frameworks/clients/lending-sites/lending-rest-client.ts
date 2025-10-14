import { SupportedSites } from 'src/core/entity/site';
import { SuppliedTokensBalance } from 'src/core/entity/supply';

export abstract class ILendingRestClient {
  readonly SITE_NAME: SupportedSites;
  abstract getCurrentBalanceOfSuppliedTokens(
    userAddress: string,
  ): Promise<SuppliedTokensBalance[]>;
  abstract getMarkets(); // remove it
}
