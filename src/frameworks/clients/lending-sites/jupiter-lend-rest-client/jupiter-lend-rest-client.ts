import fetch from 'node-fetch';
import { ILendingRestClient } from 'src/frameworks/clients/lending-sites/lending-rest-client';
import { Sites, SupportedSites } from 'src/core/entity/site';
import {
  LendingToken,
  SuppliedTokensBalanceWithUnderlayingAssetAdditionalData,
} from './types';
import { ParseUtil } from '../parse-utils';
import { StringUtil } from 'src/shared/utils/convert-string';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JupiterLendRestClient implements ILendingRestClient {
  readonly SITE_NAME: SupportedSites = Sites.JUPITER;
  private baseUrl = 'https://lite-api.jup.ag/';

  constructor() {}

  async getCurrentBalanceOfSuppliedTokens(
    userAddress: string,
    poolAddresses?: string[],
  ): Promise<SuppliedTokensBalanceWithUnderlayingAssetAdditionalData[]> {
    const data = await fetch(
      `${this.baseUrl}lend/v1/earn/positions?users=${userAddress}`,
    );
    const lendingTokensData = (await data.json()) as LendingToken[];
    return lendingTokensData
      .filter(
        (ltd) =>
          ltd.underlyingAssets !== '0' ||
          poolAddresses?.includes(ltd.token.address),
      )
      .map((ltd) => {
        const tokenBalance = ParseUtil.divideTokenAmount(
          ltd.underlyingAssets,
          ltd.token.decimals,
        );
        return {
          market: {
            poolAddress: ltd.token.address,
            marketName: StringUtil.removeWhiteSpaces(ltd.token.name),
            chainName: ltd.token.asset.chainId,
          },
          balance: tokenBalance,
          balanceInUsd: ParseUtil.getUsdValue(
            tokenBalance,
            ltd.token.asset.price,
          ),
          tokenSymbol: ltd.token.asset.symbol,
          site: this.SITE_NAME,
          underlyingAssetAddress: ltd.token.assetAddress,
          usdPricerPerToken: ltd.token.asset.price,
        };
      });
  }
}
