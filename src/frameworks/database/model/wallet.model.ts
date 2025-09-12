import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
export type WalletDocument = HydratedDocument<Wallet>;

export class FileData {
  @Prop({ required: true })
  transactions: string[];

  @Prop({ required: true })
  transactionBalance: string;

  @Prop({ required: true })
  transactionBalanceInUsd: string;

  @Prop({ required: true })
  balance: string;

  @Prop({ required: true })
  balanceInUsd: string;

  @Prop({ required: true })
  dailyProfitInUsd: string;

  @Prop({ required: true })
  dailyProfitInPercentage: string;

  @Prop({ required: true })
  date: Date;
}

class TokenSupplied {
  @Prop({ required: true })
  currentBalance: string;

  @Prop({ required: true })
  currentBalanceInUsd: string;

  @Prop({ required: true, unique: true })
  currency: string;

  @Prop({ type: [FileData] })
  fileData: FileData[];

  @Prop({ required: true })
  lastUpdate: Date;
}

@Schema()
export class Wallet {
  @Prop({ required: true, unique: true })
  address: string;

  @Prop({ type: [TokenSupplied] })
  tokenSupplied: TokenSupplied[];
}
export const WalletSchema = SchemaFactory.createForClass(Wallet);
