import { IDatabaseRepository } from 'src/core/abstract/database-client.ts/database-repository';
import { Wallet } from 'src/frameworks/database/model/wallet.model';

export class WalletValidator {
  static isValid(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  static async isInDatabase(
    address: string,
    databaseRepository: IDatabaseRepository<Wallet>,
  ) {
    const wallet = await databaseRepository.findByAddress(address);
    return wallet ? true : false;
  }

  static async assertValid(
    address: string,
    databaseRepository: IDatabaseRepository<Wallet>,
  ): Promise<void> {
    if (!this.isValid(address)) {
      throw new Error(`Invalid wallet address: ${address}`);
    }
    if (await this.isInDatabase(address, databaseRepository)) {
      throw new Error(`Wallet ${address} already exists`);
    }
  }
}
