import { Module } from '@nestjs/common';
import { WalletDataBaseRepositoryModule } from './wallet/wallet-repository.module';
import { DataBaseRepository } from './database-repository';
import { IDataBaseRepository } from 'src/core/abstract/database-repository.ts/database-repository';

@Module({
  imports: [WalletDataBaseRepositoryModule],
  providers: [{ useClass: DataBaseRepository, provide: IDataBaseRepository }],
  exports: [IDataBaseRepository],
})
export class DatabaseServiceModule {}
