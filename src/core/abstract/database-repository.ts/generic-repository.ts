export abstract class GenericDataBaseRepository<T> {
  abstract createOrUpdate(item: T): Promise<T>;
  abstract update(key: string, item: Partial<T>): Promise<void>;
  abstract delete(key: string): Promise<void>;
  abstract findAll(): Promise<T[]>;
}
