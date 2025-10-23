import {
  SuppliedSite,
  Wallet,
} from 'src/frameworks/database/model/wallet.model';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { IWalletDatabaseRepository } from 'src/core/abstract/database-repository.ts/wallet-repository/wallet-database-repository';
import { ImmutableDate } from 'src/core/entity/immutable-date';

@Injectable()
export class WalletDataBaseRepository implements IWalletDatabaseRepository {
  constructor(
    @InjectModel(Wallet.name)
    private readonly mongoClient: Model<Wallet>,
  ) {}

  async createOrUpdate(wallet: Wallet): Promise<Wallet> {
    return await this.mongoClient.findOneAndUpdate(
      { address: wallet.address },
      { $set: wallet },
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

  async getSitesRecentUpdatedTokensByWalletAddress(
    walletAddress: string,
    date: ImmutableDate,
  ): Promise<SuppliedSite[]> {
    const dateForGettingData = date ? new Date(+date) : new Date();
    dateForGettingData.setDate(dateForGettingData.getDate() - 1);
    const startOfDay = new Date(dateForGettingData.setHours(0, 0, 0, 0));

    const result: SuppliedSite[] = await this.mongoClient.aggregate([
      // Match wallet
      { $match: { address: walletAddress } },

      // Unwind sitesSupplied to process each site
      { $unwind: '$sitesSupplied' },

      // Unwind suppliedChains to filter tokens
      { $unwind: '$sitesSupplied.suppliedChains' },

      // Keep only tokens updated since yesterday
      {
        $addFields: {
          'sitesSupplied.suppliedChains.tokens': {
            $filter: {
              input: '$sitesSupplied.suppliedChains.tokens',
              as: 'token',
              cond: { $gte: ['$$token.lastUpdate', startOfDay] },
            },
          },
        },
      },

      // Remove chains with no recent tokens
      {
        $match: { 'sitesSupplied.suppliedChains.tokens.0': { $exists: true } },
      },

      // Group chains back under each site
      {
        $group: {
          _id: '$sitesSupplied.name', // group by site name
          suppliedChains: { $push: '$sitesSupplied.suppliedChains' },
        },
      },

      // Restore the site object structure
      {
        $project: {
          _id: 0,
          name: '$_id',
          suppliedChains: 1,
        },
      },

      // Optional: sort by site name
      { $sort: { name: 1 } },
    ]);

    return result;
  }
}
