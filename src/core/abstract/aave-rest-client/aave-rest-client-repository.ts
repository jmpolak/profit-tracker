import { SuppliedTokensBalance } from 'src/core/entity/supply';
import { UserTransaction } from 'src/core/entity/transaction';

export abstract class IAaveRestClientRepository {
  readonly SITE_NAME: string;
  abstract getCurrentBalance(
    userAddress: string,
  ): Promise<SuppliedTokensBalance[]>;
  abstract getTransactions(
    userAddress: string,
    poolAddress: string,
    chainId: number,
  ): Promise<UserTransaction[]>;
  abstract getTransactionsOnAllChains(
    userAddress: string,
  ): Promise<UserTransaction[]>;
  abstract getMarkets();
}
