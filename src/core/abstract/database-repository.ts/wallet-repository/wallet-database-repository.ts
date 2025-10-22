import { Wallet } from 'src/frameworks/database/model/wallet.model';
import { GenericDataBaseRepository } from '../generic-repository';
import { ImmutableDate } from 'src/core/entity/immutable-date';

export abstract class IWalletDatabaseRepository extends GenericDataBaseRepository<Wallet> {
  abstract findByAddress(address: string): Promise<Wallet | null>;
  abstract getAllRecentUpdatedTokenSuppliedByWalletAddress(
    walletAddress: string,
    date: ImmutableDate,
  ): Promise<Wallet | null>;
}
