export enum TransactionType {
  SUPPLY = 'UserSupplyTransaction',
  WITHDRAW = 'UserWithdrawTransaction',
}

export type SuppliedPositions = Record<
  string,
  { balance: string; balanceInUsd: string }
>;
