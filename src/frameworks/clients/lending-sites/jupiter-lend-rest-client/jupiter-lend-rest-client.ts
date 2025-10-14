import { Connection, PublicKey } from '@solana/web3.js';
import fetch from 'node-fetch';
import { ILendingRestClient } from 'src/frameworks/clients/lending-sites/lending-rest-client';

import { Sites, SupportedSites } from 'src/core/entity/site';
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
import { SolanaRpc } from '../../rpc/solana/solana-rpc';
import { CryptoPriceApi } from '../../external-api/crypto-price-api/crypto-price-api';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JupiterLendRestClient implements ILendingRestClient {
  readonly SITE_NAME: SupportedSites = Sites.JUPITER;
  private baseUrl = 'https://lite-api.jup.ag/';

  constructor() {}

  async getCurrentBalanceOfSuppliedTokens(
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

  public async getMarkets() {
    const supply = await this.getCurrentBalanceOfSuppliedTokens(
      'BAGbqJ9SerqSFeZzkFvKumhnH64G6s2PTW2VWc5MTpYG',
    );
  }
}
