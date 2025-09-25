import { Injectable } from '@nestjs/common';
import { IDataBaseRepository } from 'src/core/abstract/database-repository.ts/database-repository';
import { IWalletDatabaseRepository } from 'src/core/abstract/database-repository.ts/wallet-repository/wallet-database-repository';
@Injectable()
export class DataBaseRepository implements IDataBaseRepository {
  public walletDataBaseRepository: IWalletDatabaseRepository;
  constructor(walletDataBaseRepository: IWalletDatabaseRepository) {
    this.walletDataBaseRepository = walletDataBaseRepository;
  }
}
