import { Injectable } from '@nestjs/common';
import { Wallet } from './model/wallet.model';
import { Model } from 'mongoose';
import { IDatabaseRepository } from 'src/core/abstract/database-client.ts/database-repository';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class MongodbClient implements IDatabaseRepository<Wallet> {
  constructor(
    @InjectModel(Wallet.name)
    private readonly mongoClient: Model<Wallet>,
  ) {} // make maybe generic class later

  async findByAddress(address: string): Promise<Wallet | null> {
    const wallet = await this.mongoClient.findOne({ address });
    // if (!wallet) {
    //   throw new Error(`Wallet with address ${address} not found`);
    // }
    return wallet;
  }

  async createOrUpdate(wallet: Wallet): Promise<Wallet> {
    return await this.mongoClient.findOneAndUpdate(
      { address: wallet.address },
      wallet,
      { upsert: true, new: true },
    );
  }

  async update(address: string, wallet: Partial<Wallet>): Promise<void> {
    await this.mongoClient.updateOne({ address }, wallet);
  }

  async delete(address: string): Promise<void> {
    await this.mongoClient.deleteOne({ address });
  }
  async findAll(): Promise<Wallet[]> {
    return await this.mongoClient.find();
  }

  async getAllRecentUpdatedTokenSuppliedByWalletAddress(
    walletAddress: string,
  ): Promise<Wallet | null> {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const wallet: Wallet | null = await this.mongoClient.findOne({
      tokenSupplied: {
        $elemMatch: {
          lastUpdate: { $gte: new Date(yesterday.setHours(0, 0, 0, 0)) },
        },
      },
      address: walletAddress,
    });
    return wallet ?? null;
  }
}
