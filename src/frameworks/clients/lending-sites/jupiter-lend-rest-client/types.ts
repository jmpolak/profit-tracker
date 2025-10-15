import { SuppliedTokensBalance } from 'src/core/entity/supply';

export type LendingToken = {
  token: Token;
  shares: string;
  underlyingAssets: string;
};

export type SuppliedTokensBalanceWithUnderlayingAssetAddressAndCeckoId =
  SuppliedTokensBalance & {
    underlyingAssetAddress: string;
    coinGeckoId: string;
  };

type Asset = {
  address: string;
  chainId: string;
  decimals: number;
  price: string;
  symbol: string;
  name: string;
  coingeckoId: string;
};
type Token = {
  address: string;
  assetAddress: string;
  asset: Asset;
  chainId: string;
  name: string;
  symbol: string;
  decimals: number;
  convertToAssets: string;
  logoUrl?: string;
  price: string;
  coingeckoId?: string;
  stakingApr?: number;
};
