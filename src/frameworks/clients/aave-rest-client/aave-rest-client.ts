import {
  AaveClient,
  chainId,
  MarketUserReserveSupplyPosition,
  OrderDirection,
  PageSize,
  UserTransactionItem,
} from '@aave/client';
// Move imports to the top and use correct paths

import { userSupplies, userTransactionHistory } from '@aave/client/actions';
import { evmAddress } from '@aave/client';

import { IAaveRestClientRepository } from 'src/core/abstract/aave-rest-client/aave-rest-client-repository';
import { InternalServerErrorException } from '@nestjs/common';
import { SuppliedPositions } from 'src/core/entity/transaction';

export class AaveRestClient implements IAaveRestClientRepository {
  private client: AaveClient;
  constructor() {
    this.client = AaveClient.create();
  }

  public async getTransactions(
    userAddress: string,
  ): Promise<UserTransactionItem[]> {
    const user = evmAddress(userAddress);
    const result = await userTransactionHistory(this.client, {
      market: evmAddress('0x794a61358D6845594F94dc1DB02A252b5b4814aD'), // Aave V3 Polygon
      user,
      chainId: chainId(137), // Polygon mainnet
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
    return result.value.items;
  }

  public async getCurrentBalance(
    userAddress: string,
  ): Promise<SuppliedPositions> {
    const user = evmAddress(userAddress);
    const result = await userSupplies(this.client, {
      markets: [
        {
          address: evmAddress('0x794a61358D6845594F94dc1DB02A252b5b4814aD'), // Aave V3 Polygon
          chainId: chainId(137),
        },
      ],
      user,
    });

    if (result.isErr()) {
      throw new InternalServerErrorException(
        'User supplies error:',
        result.error,
      );
    }
    const suppliedPositions: SuppliedPositions = {};
    result.value.forEach((position: MarketUserReserveSupplyPosition) => {
      const token = position.currency.symbol;
      const currentAmount = position.balance.amount.value.toString();
      const currentAmountUsd = position.balance.usd.toString();
      suppliedPositions[token] = {
        balance: currentAmount,
        balanceInUsd: currentAmountUsd,
      };
    });
    return suppliedPositions;
  }
}
