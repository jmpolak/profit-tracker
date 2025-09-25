import { Module } from '@nestjs/common';
import { IWalletDatabaseRepository } from 'src/core/abstract/database-repository.ts/wallet-repository/wallet-database-repository';
import { WalletDataBaseRepository } from './wallet-repository';
import { MongodbModule } from 'src/frameworks/database/mongodb.module';

@Module({
  imports: [MongodbModule],
  providers: [
    {
      useClass: WalletDataBaseRepository,
      provide: IWalletDatabaseRepository,
    },
  ],
  exports: [IWalletDatabaseRepository],
})
export class WalletDataBaseRepositoryModule {}
