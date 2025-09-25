import { IWalletDatabaseRepository } from './wallet-repository/wallet-database-repository';

export abstract class IDataBaseRepository {
  abstract walletDataBaseRepository: IWalletDatabaseRepository;
}
