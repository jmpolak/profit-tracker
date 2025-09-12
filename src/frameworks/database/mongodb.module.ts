import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Wallet, WalletSchema } from './model/wallet.model';
import { IDatabaseRepository } from 'src/core/abstract/database-client.ts/database-repository';
import { MongodbClient } from './mongodb-client';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://mongo:27017/database'),
    MongooseModule.forFeature([{ name: Wallet.name, schema: WalletSchema }]),
  ],
  controllers: [],
  providers: [
    {
      provide: IDatabaseRepository,
      useClass: MongodbClient,
    },
  ],
  exports: [IDatabaseRepository],
})
export class MongodbModule {}
