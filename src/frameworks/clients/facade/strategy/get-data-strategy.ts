import { DailyPositionsInformation } from 'src/core/entity/daily-position-information';
import { JupiterLendRestClient } from '../../lending-sites/jupiter-lend-rest-client/jupiter-lend-rest-client';
import { UserTransaction } from 'src/core/entity/transaction';
import { SolanaRpc } from '../../rpc/solana/solana-rpc';
import { AaveRestClient } from '../../lending-sites/aave-rest-client/aave-rest-client';
import { ILendingRestClient } from 'src/frameworks/clients/lending-sites/lending-rest-client';
import { Injectable } from '@nestjs/common';
import { WalletValidator } from 'src/application/validators/wallet-validator/wallet-validator';
import { ImmutableDate } from 'src/core/entity/immutable-date';

export interface GetDailyInformationStrategy {
  client: ILendingRestClient;
  isExecutable(wallet: string): boolean;
  getDailyPositionInformation(
    wallet: string,
    returnTransactions: boolean,
    poolAddresses?: string[],
    date?: ImmutableDate,
  ): Promise<DailyPositionsInformation>;
}

@Injectable()
export class AaveGetDailyInformationStrategy
  implements GetDailyInformationStrategy
{
  constructor(public readonly client: AaveRestClient) {}

  public isExecutable(walletAddress: string) {
    return WalletValidator.isEvmValid(walletAddress);
  }
  async getDailyPositionInformation(
    wallet: string,
    returnTransactions: boolean,
  ): Promise<DailyPositionsInformation> {
    const currentSuppliedPositions =
      await this.client.getCurrentBalanceOfSuppliedTokens(wallet);
    const userTransactions = returnTransactions
      ? await this.client.getTransactionsOnAllChains(wallet)
      : [];

    return { supply: currentSuppliedPositions, userTransactions };
  }
}

@Injectable()
export class JupiterGetDailyInformationStrategy
  implements GetDailyInformationStrategy
{
  constructor(
    public readonly client: JupiterLendRestClient,
    private rpc: SolanaRpc,
  ) {}

  public isExecutable(walletAddress: string) {
    return WalletValidator.isSolanaAddressValid(walletAddress);
  }

  async getDailyPositionInformation(
    wallet: string,
    returnTransactions: boolean,
    poolAddresses: string[],
    date: ImmutableDate,
  ): Promise<DailyPositionsInformation> {
    const supply = await this.client.getCurrentBalanceOfSuppliedTokens(
      wallet,
      poolAddresses,
    );
    const userTransactions: UserTransaction[] = [];
    if (returnTransactions) {
      for (const s of supply) {
        const transactions = await this.rpc.getTransactionsFromRpc(
          wallet,
          s.underlyingAssetAddress,
          {
            poolAddress: s.market.poolAddress,
            marketName: s.market.marketName,
            tokenSymbol: s.tokenSymbol,
            tokenPriceUsd: s.usdPricerPerToken,
            siteName: s.site,
          },
          date,
        );
        userTransactions.push(...transactions);
      }
    }
    return { supply, userTransactions };
  }
}
