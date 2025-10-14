import { DailyPositionsInformation } from 'src/core/entity/daily-position-information';
import { JupiterLendRestClient } from '../../lending-sites/jupiter-lend-rest-client/jupiter-lend-rest-client';
import { UserTransaction } from 'src/core/entity/transaction';
import { ParseUtil } from '../../lending-sites/parse-utils';
import { SolanaRpc } from '../../rpc/solana/solana-rpc';
import { CryptoPriceApi } from '../../external-api/crypto-price-api/crypto-price-api';
import { AaveRestClient } from '../../lending-sites/aave-rest-client/aave-rest-client';
import { ILendingRestClient } from 'src/frameworks/clients/lending-sites/lending-rest-client';
import { SupportedSites } from 'src/core/entity/site';
import { Injectable } from '@nestjs/common';
import { WalletValidator } from 'src/application/validators/wallet-validator/wallet-validator';

export interface GetDailyInformationStrategy {
  client: ILendingRestClient;
  isExecutable(wallet: string): boolean;
  getSite(): SupportedSites;
  getDailyPositionInformation(
    wallet: string,
  ): Promise<DailyPositionsInformation>;
}

@Injectable()
export class AaveGetDailyInformationStrategy
  implements GetDailyInformationStrategy
{
  constructor(public readonly client: AaveRestClient) {}
  getSite() {
    return this.client.SITE_NAME;
  }
  public isExecutable(walletAddress: string) {
    return WalletValidator.isEvmValid(walletAddress);
  }
  async getDailyPositionInformation(
    wallet: string,
  ): Promise<DailyPositionsInformation> {
    const currentSuppliedPositions =
      await this.client.getCurrentBalanceOfSuppliedTokens(wallet);
    const userTransactions =
      await this.client.getTransactionsOnAllChains(wallet);

    return { supply: currentSuppliedPositions, userTransactions };
  }
}

@Injectable()
export class JupiterGetDailyInformationStrategy
  implements GetDailyInformationStrategy
{
  constructor(
    public readonly client: JupiterLendRestClient,
    private connection: SolanaRpc,
    private priceApi: CryptoPriceApi,
  ) {}

  public isExecutable(walletAddress: string) {
    return WalletValidator.isSolanaAddressValid(walletAddress);
  }

  getSite(): SupportedSites {
    return this.client.SITE_NAME;
  }

  async getDailyPositionInformation(
    wallet: string,
  ): Promise<DailyPositionsInformation> {
    const supply = await this.client.getCurrentBalanceOfSuppliedTokens(wallet);

    const usdPricesForTokens = await this.priceApi.getUsdPrices(
      supply.map((s) => s.tokenSymbol),
    );

    supply.forEach(
      (s) =>
        (s.balanceInUsd = ParseUtil.getUsdValue(
          s.balance,
          usdPricesForTokens.get(s.tokenSymbol)!.toString(),
        )),
    );

    const userTransactions: UserTransaction[] = [];
    for (const s of supply) {
      const transactions = await this.connection.getTransactionsFromRpc(
        wallet,
        s.underlyingAssetAddress,
        {
          poolAddress: s.market.poolAddress,
          marketName: s.market.marketName,
          tokenSymbol: s.tokenSymbol,
          tokenPriceUsd: usdPricesForTokens.get(s.tokenSymbol)!,
          siteName: s.site,
        },
      );
      userTransactions.push(...transactions);
    }
    return { supply: supply, userTransactions };
  }
}
