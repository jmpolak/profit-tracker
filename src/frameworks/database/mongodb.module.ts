import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Wallet, WalletSchema } from './model/wallet.model';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://mongo:27017/database'),
    MongooseModule.forFeature([{ name: Wallet.name, schema: WalletSchema }]),
  ],
  exports: [MongooseModule],
})
export class MongodbModule {}
