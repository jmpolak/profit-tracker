import { Wallet } from 'src/frameworks/database/model/wallet.model';

export type WalletWithFilters = Wallet & {
  filters: {
    site: string;
    chain: string;
    token: string;
    filters: {
      year: number;
      months: number[];
    }[];
  }[];
};
