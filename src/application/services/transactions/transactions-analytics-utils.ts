import { TransactionType, UserTransaction } from 'src/core/entity/transaction';
import { BigNumber } from 'bignumber.js';
import { ImmutableDate } from 'src/core/entity/immutable-date';
export abstract class TransactionsAnalyticUtils {
  static filterTransactionsByDateAndByTokenSymbol(
    transactions: UserTransaction[],
    tokenSymbol: string,
    poolAddress: string,
    marketName: string,
    date: ImmutableDate,
  ) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const dayOfMonth = date.getDate();

    return transactions.filter((tx) => {
      const txDate = new Date(tx.timestamp); // attention: tx.timestamp is UTC but we use local time
      return (
        txDate.getFullYear() === year &&
        txDate.getMonth() === month &&
        txDate.getDate() === dayOfMonth &&
        tx.tokenSymbol.equalsIgnore(tokenSymbol) &&
        tx.poolAddress.equalsIgnore(poolAddress) &&
        tx.marketName.equalsIgnore(marketName)
      );
    });
  }

  static getTransactionsBalance(transactions: UserTransaction[]) {
    const transactionsByType =
      TransactionsAnalyticUtils.groupByTransactionsType(transactions);
    const totalDeposits = transactionsByType[TransactionType.SUPPLY]
      ? transactionsByType[TransactionType.SUPPLY].reduce(
          (sum, tx) => sum.plus(BigNumber(tx.value)),
          new BigNumber(0),
        )
      : new BigNumber(0);
    const totalWithdrawals = transactionsByType[TransactionType.WITHDRAW]
      ? transactionsByType[TransactionType.WITHDRAW].reduce(
          (sum, tx) => sum.plus(BigNumber(tx.value)),
          new BigNumber(0),
        )
      : new BigNumber(0);
    return totalDeposits.minus(totalWithdrawals).toString();
  }

  static getTransactionsBalanceInUsd(transactions: UserTransaction[]) {
    const transactionsByType =
      TransactionsAnalyticUtils.groupByTransactionsType(transactions);
    const totalDeposits = transactionsByType[TransactionType.SUPPLY]
      ? transactionsByType[TransactionType.SUPPLY].reduce(
          (sum, tx) => sum.plus(BigNumber(tx.usdValue)),
          new BigNumber(0),
        )
      : new BigNumber(0);
    const totalWithdrawals = transactionsByType[TransactionType.WITHDRAW]
      ? transactionsByType[TransactionType.WITHDRAW].reduce(
          (sum, tx) => sum.plus(BigNumber(tx.usdValue)),
          new BigNumber(0),
        )
      : new BigNumber(0);
    return totalDeposits.minus(totalWithdrawals).toString();
  }

  private static groupByTransactionsType(transactions: UserTransaction[]) {
    return transactions.reduce(
      (acc, tx) => {
        const type = tx.type;
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push(tx);
        return acc;
      },
      {} as Record<TransactionType, UserTransaction[]>,
    );
  }
}
