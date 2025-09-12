export abstract class IDatabaseRepository<T> {
  abstract findByAddress(address: string): Promise<T | null>;
  abstract createOrUpdate(item: T): Promise<T>;
  abstract update(address: string, item: Partial<T>);
  abstract delete(address: string);
  abstract findAll(): Promise<T[]>;
  abstract getAllRecentUpdatedTokenSuppliedByWalletAddress(
    walletAddress: string,
  ): Promise<T | null>;
}
