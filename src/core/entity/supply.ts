import { SupportedSites } from './site';

export type SuppliedTokensBalance = {
  market: {
    poolAddress: string;
    marketName: string;
    chainName: string;
  };
  balance: string;
  balanceInUsd: string;
  tokenSymbol: string;
  site: SupportedSites;
};
