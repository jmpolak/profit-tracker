import { Module } from '@nestjs/common';
import { WalletUseCase } from './wallet-use-case';
import { AaveRestModule } from 'src/frameworks/clients/aave-rest-client/aave-rest.module';
import { DatabaseServiceModule } from 'src/frameworks/database-repository/database-repository.module';

@Module({
  imports: [DatabaseServiceModule, AaveRestModule],
  controllers: [],
  providers: [WalletUseCase],

  exports: [WalletUseCase],
})
export class WalletModule {}
