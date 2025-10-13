import { SuppliedTokensBalance } from './supply';
import { UserTransaction } from './transaction';

export interface DailyPositionsInformation {
  supply: SuppliedTokensBalance[];
  userTransactions: UserTransaction[];
}

export interface DailyPositionInformationForOnePosition {
  supply: SuppliedTokensBalance;
  userTransactions: UserTransaction[];
  transactionBalance: string;
  transactionBalanceInUsd: string;
  dailyProfit: string;
  dailyProfitInPercentage: string;
}
