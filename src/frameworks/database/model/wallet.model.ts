import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { SupportedSites } from 'src/core/entity/site';
export type WalletDocument = HydratedDocument<Wallet>;

export class HistoricalData {
  @Prop({ required: true })
  transactions: string[];
  @Prop({ required: true })
  transactionBalance: string;
  @Prop({ required: true })
  transactionBalanceInUsd: string;
  @Prop({ required: true })
  balance: string;
  @Prop({ required: true })
  dailyProfit: string;
  @Prop({ required: true })
  dailyProfitInPercentage: string;
  @Prop({ required: false })
  createdByCreateWalletEvent?: boolean;
  @Prop({ required: true })
  date: Date;
}

export class SuppliedToken {
  @Prop({ required: true })
  currentBalance: string;
  @Prop({ required: true })
  currentBalanceInUsd: string;
  @Prop({ required: true })
  currency: string;
  @Prop({ required: true, type: [HistoricalData] })
  historicalData: HistoricalData[];
  @Prop({ required: true })
  lastUpdate: Date;
}

export class SuppliedChain {
  @Prop({ required: true })
  marketName: string; //AaveEtherium
  @Prop({ required: true })
  chainName: string; //Etherium
  @Prop({ required: true })
  poolAddress: string;
  @Prop({ required: true, type: [SuppliedToken] })
  tokens: SuppliedToken[];
}

export class SuppliedSite {
  @Prop({ required: true })
  name: SupportedSites;
  @Prop({ required: true })
  suppliedChains: SuppliedChain[];
}

@Schema()
export class Wallet {
  @Prop({ required: true, unique: true })
  address: string;

  @Prop({ type: [SuppliedSite] })
  sitesSupplied: SuppliedSite[];
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);
