import { Module } from '@nestjs/common';
import { WalletUseCase } from './wallet-use-case';
import { MongodbModule } from 'src/frameworks/database/mongodb.module';
import { AaveRestModule } from 'src/frameworks/clients/aave-rest-client/aave-rest.module';

@Module({
  imports: [MongodbModule, AaveRestModule],
  controllers: [],
  providers: [WalletUseCase],

  exports: [WalletUseCase],
})
export class WalletModule {}
