import { UserTransactionItem } from '@aave/client';
import { SuppliedPositions } from 'src/core/entity/transaction';

export abstract class IAaveRestClientRepository {
  // if we add suport for more sites like jupiter we would make this className<T> because UserTransactionItem is from aave
  abstract getCurrentBalance(userAddress: string): Promise<SuppliedPositions>;
  abstract getTransactions(userAddress: string): Promise<UserTransactionItem[]>;
}
