import {
  AaveClient,
  chainId,
  MarketUserReserveSupplyPosition,
  OrderDirection,
  PageSize,
} from '@aave/client';
import { userSupplies, userTransactionHistory } from '@aave/client/actions';
import { evmAddress } from '@aave/client';
import { ILendingRestClient } from 'src/frameworks/clients/lending-sites/lending-rest-client.js';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SuppliedTokensBalance } from 'src/core/entity/supply';
import { AAVE_CHAINS } from '../../../../../all-chains.js';
import { Sites, SupportedSites } from 'src/core/entity/site';
import {
  TransactionType,
  UserTransaction,
} from 'src/core/entity/transaction.js';

@Injectable()
export class AaveRestClient implements ILendingRestClient {
  readonly SITE_NAME: SupportedSites = Sites.AAVE;

  private client: AaveClient;
  readonly AAVE_CHAINS: {
    name: string;
    chainName: string;
    chainId: number;
    poolAddress: string;
  }[];
  constructor() {
    this.client = AaveClient.create();
    this.AAVE_CHAINS = AAVE_CHAINS;
  }

  async getTransactionsOnAllChains(userAddress: string) {
    return await Promise.all(
      this.AAVE_CHAINS.map((ac) =>
        this.getTransactions(userAddress, ac.poolAddress, ac.chainId),
      ),
    ).then((x) => x.flat());
  }

  private async getTransactions(
    userAddress: string,
    poolAddress: string,
    chainIdNumber: number,
  ): Promise<UserTransaction[]> {
    const user = evmAddress(userAddress);
    const result = await userTransactionHistory(this.client, {
      market: evmAddress(poolAddress),
      user,
      chainId: chainId(chainIdNumber),
      orderBy: { date: OrderDirection.Desc },
      pageSize: PageSize.Fifty,
      filter: ['SUPPLY', 'WITHDRAW'],
    });
    if (result.isErr()) {
      throw new InternalServerErrorException(
        'User transaction history error:',
        result.error,
      );
    }
    return result.value.items.map((i) => ({
      site: this.SITE_NAME,
      marketName: String(i['reserve']['market'].name),
      poolAddress: poolAddress,
      type: i.__typename as TransactionType,
      txHash: i.txHash,
      tokenSymbol: String(i['reserve'].aToken.symbol),
      value: String(i['amount'].amount.value),
      usdValue: String(i['amount'].usd),
      timestamp: new Date(i.timestamp),
    }));
  }

  async getCurrentBalanceOfSuppliedTokens(
    userAddress: string,
  ): Promise<SuppliedTokensBalance[]> {
    const user = evmAddress(userAddress);
    const result = await userSupplies(this.client, {
      markets: this.AAVE_CHAINS.map((ac) => ({
        address: evmAddress(ac.poolAddress),
        chainId: chainId(ac.chainId),
      })),
      user,
    });

    if (result.isErr()) {
      throw new InternalServerErrorException(
        'User supplies error:',
        result.error,
      );
    }
    const suppliedPositions: SuppliedTokensBalance[] = [];
    result.value.forEach((position: MarketUserReserveSupplyPosition) => {
      const token = position.currency.symbol;
      const currentAmount = position.balance.amount.value.toString();
      const chainName = position.market.chain.name;
      const marketName = position.market.name;
      const poolAddress = position.market.address;
      const currentAmountUsd = position.balance.usd.toString();
      suppliedPositions.push({
        site: this.SITE_NAME,
        market: {
          poolAddress,
          chainName,
          marketName,
        },
        balance: currentAmount,
        balanceInUsd: currentAmountUsd,
        tokenSymbol: token,
      });
    });
    return suppliedPositions;
  }

  public async getMarkets() {
    return this.getCurrentBalanceOfSuppliedTokens(
      '0x56FD92cb3558D688F178AA3a9a15a1bE6631B4bf',
    );
  }
}
