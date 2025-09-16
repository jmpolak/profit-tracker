import { Wallet } from 'src/frameworks/database/model/wallet.model';

export type WalletWithFilters = Wallet & {
  filters: {
    year: number;
    months: number[];
  }[];
};
