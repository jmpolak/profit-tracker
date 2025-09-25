import { Wallet } from 'src/frameworks/database/model/wallet.model';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { IWalletDatabaseRepository } from 'src/core/abstract/database-repository.ts/wallet-repository/wallet-database-repository';

@Injectable()
export class WalletDataBaseRepository implements IWalletDatabaseRepository {
  constructor(
    @InjectModel(Wallet.name)
    private readonly mongoClient: Model<Wallet>,
  ) {}

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

  async findByAddress(address: string): Promise<Wallet | null> {
    const wallet = await this.mongoClient.findOne({ address });
    return wallet;
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
