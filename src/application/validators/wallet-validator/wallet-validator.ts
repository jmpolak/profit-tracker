import { IDataBaseRepository } from 'src/core/abstract/database-repository.ts/database-repository';

import { Wallet } from 'src/frameworks/database/model/wallet.model';

export class WalletValidator {
  static async assertValid(
    address: string,
    databaseRepository: IDataBaseRepository,
  ): Promise<void> {
    if (!this.isEvmValid(address) && !this.isSolanaAddressValid(address)) {
      throw new Error(`Invalid wallet address: ${address}`);
    }
    if (await this.isInDatabase(address, databaseRepository)) {
      throw new Error(`Wallet ${address} already exists`);
    }
  }

  static async walletValidForFileGeneration(
    address: string,
    databaseRepository: IDataBaseRepository,
  ) {
    const wallet = await WalletValidator.isInDatabase(
      address,
      databaseRepository,
    );
    if (!wallet) {
      throw new Error(`Wallet ${address} do not exists`);
    }
    if (!WalletValidator.hasTokenSupplied(wallet)) {
      throw new Error(`Wallet ${wallet.address} do not have token supplied`);
    }
  }

  static isEvmValid(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
  static isSolanaAddressValid(address: string): boolean {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  }
  private static hasTokenSupplied(wallet: Wallet) {
    return wallet?.sitesSupplied.length ?? 0 > 0;
  }

  private static async isInDatabase(
    address: string,
    databaseRepository: IDataBaseRepository,
  ) {
    const wallet =
      await databaseRepository.walletDataBaseRepository.findByAddress(address);
    return wallet;
  }
}
