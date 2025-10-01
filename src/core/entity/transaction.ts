import { SupportedSites } from './site';

export enum TransactionType {
  SUPPLY = 'UserSupplyTransaction',
  WITHDRAW = 'UserWithdrawTransaction',
}

export interface UserTransaction {
  site: SupportedSites;
  poolAddress: string;
  marketName: string;
  type: TransactionType;
  txHash: string;
  tokenSymbol: string;
  value: string;
  usdValue: string;
  timestamp: Date;
}
