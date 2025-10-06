import { Wallet } from 'src/frameworks/database/model/wallet.model';
import { GenericDataBaseRepository } from '../generic-repository';

export abstract class IWalletDatabaseRepository extends GenericDataBaseRepository<Wallet> {
  abstract findByAddress(address: string): Promise<Wallet | null>;
  abstract getAllRecentUpdatedTokenSuppliedByWalletAddress(
    walletAddress: string,
  ): Promise<Wallet | null>;
}
