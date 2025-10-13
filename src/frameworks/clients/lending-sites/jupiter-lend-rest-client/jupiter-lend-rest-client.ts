import { Connection, PublicKey } from '@solana/web3.js';
import fetch from 'node-fetch';
import { ILendingRestClient } from 'src/core/abstract/lending-rest-client/lending-rest-client';

import { Sites } from 'src/core/entity/site';
import { UserTransaction } from 'src/core/entity/transaction';
import {
  LendingToken,
  SuppliedTokensBalanceWithUnderlayingAssetAddress,
} from './types';
import { DailyPositionsInformation } from 'src/core/entity/daily-position-information';
import { ParseUtil } from '../parse-utils';
import { TimeUtil } from 'src/shared/utils/time';
import { WalletValidator } from 'src/application/validators/wallet-validator/wallet-validator';
import { StringUtil } from 'src/shared/utils/convert-string';
import { SolanaRpc } from '../../../rpc/solana/solana-rpc';
import { CryptoPriceApi } from '../../external-api/crypto-price-api/crypto-price-api';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JupiterLendRestClient implements ILendingRestClient {
  readonly SITE_NAME = Sites.JUPITER;
  private baseUrl = 'https://lite-api.jup.ag/';

  constructor(
    private connection: SolanaRpc,
    private priceApi: CryptoPriceApi,
  ) {}

  public isExecutable(walletAddress: string) {
    return WalletValidator.isSolanaAddressValid(walletAddress);
  }

  async getDailyPositionInformation(
    wallet: string,
  ): Promise<DailyPositionsInformation> {
    const supply = await this.getCurrentBalanceOfSuppliedTokens(wallet);

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
      const transactions = await this.getTransactions(
        wallet,
        s.underlyingAssetAddress,
        {
          poolAddress: s.market.poolAddress,
          marketName: s.market.marketName,
          tokenSymbol: s.tokenSymbol,
          tokenPriceUsd: usdPricesForTokens.get(s.tokenSymbol)!,
        },
      );
      userTransactions.push(...transactions);
    }
    return { supply: supply, userTransactions };
  }

  private async getCurrentBalanceOfSuppliedTokens(
    userAddress: string,
  ): Promise<SuppliedTokensBalanceWithUnderlayingAssetAddress[]> {
    const data = await fetch(
      `${this.baseUrl}lend/v1/earn/positions?users=${userAddress}`,
    );
    const lendingTokensData = (await data.json()) as LendingToken[];
    return lendingTokensData
      .filter((ltd) => ltd.underlyingAssets !== '0')
      .map((ltd) => ({
        market: {
          poolAddress: ltd.token.address,
          marketName: StringUtil.removeWhiteSpaces(ltd.token.name),
          chainName: ltd.token.asset.chainId,
        },
        balance: ParseUtil.divideTokenAmount(
          ltd.underlyingAssets,
          ltd.token.decimals,
        ),
        balanceInUsd: '0', // it will be set later in func getDailyPositionInformation;
        tokenSymbol: ltd.token.asset.symbol,
        site: this.SITE_NAME,
        underlyingAssetAddress: ltd.token.assetAddress,
      }));
  }

  private async getTransactions(
    userAddress: string,
    underlyingAssetAddress: string,
    metadata: {
      poolAddress: string;
      marketName: string;
      tokenSymbol: string;
      tokenPriceUsd: number;
    },
  ): Promise<UserTransaction[]> {
    const BATCH_SIZE = 5;
    const result: UserTransaction[] = [];
    const sigInfos = await this.connection.getSignaturesForAddress(
      new PublicKey(userAddress),
      { limit: 50 }, // ToDo we could also use { before: signature} we would use the latest transaction of this user
    );

    for (let i = 0; i < sigInfos.length; i += BATCH_SIZE) {
      const batch = sigInfos.slice(i, i + BATCH_SIZE);
      const signatures = batch.map((s) => s.signature);

      for (const signature of signatures) {
        const t = await this.connection.getParsedTransaction(signature, {
          maxSupportedTransactionVersion: 0,
        });
        if (t) {
          const resultTrx = this.connection.parseRpcTransaction(
            t,
            underlyingAssetAddress,
            metadata,
            this.SITE_NAME,
          );
          resultTrx ? result.push(resultTrx) : undefined;
        }
        await TimeUtil.delay(500);
      }

      await TimeUtil.delay(500); // throttle
    }

    return result;
  }

  public async getMarkets() {
    return await this.getDailyPositionInformation(
      'BAGbqJ9SerqSFeZzkFvKumhnH64G6s2PTW2VWc5MTpYG',
    );
    const supply = await this.getCurrentBalanceOfSuppliedTokens(
      'BAGbqJ9SerqSFeZzkFvKumhnH64G6s2PTW2VWc5MTpYG',
    );
    const result: UserTransaction[] = [];
    for (const s of supply) {
      const transactions = await this.getTransactions(
        'BAGbqJ9SerqSFeZzkFvKumhnH64G6s2PTW2VWc5MTpYG',
        s.underlyingAssetAddress,
        {
          poolAddress: s.market.poolAddress,
          marketName: s.market.marketName,
          tokenSymbol: s.tokenSymbol,
          tokenPriceUsd: 0,
        },
      );
      result.push(...transactions);
    }
    return result;
  }
}
